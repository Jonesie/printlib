import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { detectSourceSiteName } from "@printlib/shared";
import {
  createModel,
  deleteModel,
  getModelDetail,
  getPrintLog,
  listModels,
  setModelPreview,
  setModelTags,
  updateModel,
} from "../db/queries.js";
import { storeUpload } from "../lib/upload.js";
import { MODELS_DIR, PREVIEWS_DIR, PRINT_LOGS_DIR } from "../config.js";
import { isValidSessionToken, SESSION_COOKIE } from "../lib/auth.js";

async function readMultipartBuffer(part: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of part) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function modelsRoutes(app: FastifyInstance) {
  app.get("/api/models", async (request) => {
    const query = request.query as { search?: string; categoryId?: string; tagId?: string; printerName?: string };
    return listModels({
      search: query.search,
      categoryId: query.categoryId ? Number(query.categoryId) : undefined,
      tagId: query.tagId ? Number(query.tagId) : undefined,
      printerName: query.printerName || undefined,
    });
  });

  app.get("/api/models/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const model = getModelDetail(id);
    if (!model) return reply.code(404).send({ error: "Model not found" });

    // Print logs (notes, photos) are only for the logged-in owner — strip
    // them at the API layer, not just in the UI, for anonymous requests.
    if (!isValidSessionToken(request.cookies[SESSION_COOKIE])) {
      return { ...model, printLogs: [] };
    }
    return model;
  });

  // multipart/form-data: name, description?, categoryId?, sourceUrl?, sourceSiteName?,
  // tags? (comma-separated), file (zero or more parts named "file" — a zip, or several
  // single files; at least one file OR a sourceUrl is required)
  app.post("/api/models", async (request, reply) => {
    const parts = request.parts();
    let name: string | undefined;
    let description: string | undefined;
    let categoryId: number | undefined;
    let sourceUrl: string | undefined;
    let sourceSiteName: string | undefined;
    let tags: string[] = [];
    const fileUploads: { filename: string; buffer: Buffer }[] = [];

    for await (const part of parts) {
      if (part.type === "file") {
        if (part.fieldname === "file") {
          fileUploads.push({ filename: part.filename, buffer: await readMultipartBuffer(part.file) });
        }
      } else {
        if (part.fieldname === "name") name = String(part.value);
        if (part.fieldname === "description") description = String(part.value);
        if (part.fieldname === "categoryId" && part.value) categoryId = Number(part.value);
        if (part.fieldname === "sourceUrl") sourceUrl = String(part.value);
        if (part.fieldname === "sourceSiteName") sourceSiteName = String(part.value);
        if (part.fieldname === "tags" && part.value) {
          tags = String(part.value)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }
    }

    if (!name) return reply.code(400).send({ error: "name is required" });
    if (fileUploads.length === 0 && !sourceUrl) {
      return reply.code(400).send({ error: "provide at least one file or a source URL" });
    }

    let resolvedSiteName: string | null = null;
    if (sourceUrl) {
      resolvedSiteName = detectSourceSiteName(sourceUrl) ?? sourceSiteName?.trim() ?? null;
      if (!resolvedSiteName) {
        return reply.code(400).send({ error: "sourceSiteName is required for this source URL" });
      }
    }

    const modelId = createModel({ name, description, categoryId, sourceUrl, sourceSiteName: resolvedSiteName });
    for (const upload of fileUploads) {
      storeUpload(modelId, upload.filename, upload.buffer);
    }
    if (tags.length) setModelTags(modelId, tags);

    return reply.code(201).send(getModelDetail(modelId));
  });

  app.patch("/api/models/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const body = request.body as {
      name?: string;
      description?: string | null;
      categoryId?: number | null;
      sourceUrl?: string | null;
      sourceSiteName?: string | null;
      rating?: number | null;
      tags?: string[];
    };
    const model = getModelDetail(id);
    if (!model) return reply.code(404).send({ error: "Model not found" });
    if (body.rating != null && (body.rating < 1 || body.rating > 5)) {
      return reply.code(400).send({ error: "rating must be between 1 and 5" });
    }

    const effectiveSourceUrl = body.sourceUrl !== undefined ? body.sourceUrl : model.sourceUrl;
    if (!effectiveSourceUrl && model.fileCount === 0) {
      return reply.code(400).send({ error: "a model needs at least a source URL or files" });
    }

    let sourceSiteName: string | null | undefined;
    if (!effectiveSourceUrl) {
      sourceSiteName = null;
    } else if (body.sourceUrl !== undefined || body.sourceSiteName !== undefined) {
      const manual = body.sourceSiteName !== undefined ? body.sourceSiteName?.trim() || null : model.sourceSiteName;
      sourceSiteName = detectSourceSiteName(effectiveSourceUrl) ?? manual;
      if (!sourceSiteName) {
        return reply.code(400).send({ error: "sourceSiteName is required for this source URL" });
      }
    }

    updateModel(id, {
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      sourceUrl: body.sourceUrl,
      sourceSiteName,
      rating: body.rating,
    });
    if (body.tags) setModelTags(id, body.tags);
    return getModelDetail(id);
  });

  // multipart/form-data: preview (a single image, typically a canvas snapshot)
  app.post("/api/models/:id/preview", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!getModelDetail(id)) return reply.code(404).send({ error: "Model not found" });

    const parts = request.parts();
    let filename: string | null = null;
    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "preview") {
        const ext = (part.filename?.split(".").pop() || "png").toLowerCase();
        const storedName = `${id}-${crypto.randomUUID()}.${ext}`;
        fs.writeFileSync(path.join(PREVIEWS_DIR, storedName), await readMultipartBuffer(part.file));
        filename = storedName;
      }
    }
    if (!filename) return reply.code(400).send({ error: "preview file is required" });

    setModelPreview(id, filename);
    return getModelDetail(id);
  });

  // JSON: { printLogId } — reuses an existing print log photo as the preview
  app.post("/api/models/:id/preview-from-log", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!getModelDetail(id)) return reply.code(404).send({ error: "Model not found" });

    const { printLogId } = request.body as { printLogId?: number };
    const log = printLogId ? getPrintLog(printLogId) : null;
    if (!log || log.modelId !== id) return reply.code(404).send({ error: "Print log not found" });
    if (!log.photoFilename) return reply.code(400).send({ error: "That print log has no photo" });

    const sourcePath = path.join(PRINT_LOGS_DIR, log.photoFilename);
    if (!fs.existsSync(sourcePath)) return reply.code(404).send({ error: "Photo file missing" });

    const ext = log.photoFilename.split(".").pop() || "jpg";
    const storedName = `${id}-${crypto.randomUUID()}.${ext}`;
    fs.copyFileSync(sourcePath, path.join(PREVIEWS_DIR, storedName));

    setModelPreview(id, storedName);
    return getModelDetail(id);
  });

  app.delete("/api/models/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!getModelDetail(id)) return reply.code(404).send({ error: "Model not found" });
    deleteModel(id);
    fs.rmSync(path.join(MODELS_DIR, String(id)), { recursive: true, force: true });
    return reply.code(204).send();
  });
}
