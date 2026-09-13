import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  createModel,
  deleteModel,
  getModelDetail,
  listModels,
  setModelPreview,
  setModelTags,
  updateModel,
} from "../db/queries.js";
import { storeUpload } from "../lib/upload.js";
import { MODELS_DIR, PREVIEWS_DIR } from "../config.js";
import { isValidSessionToken, SESSION_COOKIE } from "../lib/auth.js";

async function readMultipartBuffer(part: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of part) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function modelsRoutes(app: FastifyInstance) {
  app.get("/api/models", async (request) => {
    const query = request.query as { search?: string; categoryId?: string; tagId?: string };
    return listModels({
      search: query.search,
      categoryId: query.categoryId ? Number(query.categoryId) : undefined,
      tagId: query.tagId ? Number(query.tagId) : undefined,
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

  // multipart/form-data: name, description?, categoryId?, sourceUrl?, tags? (comma-separated),
  // file (one or more parts named "file" — a zip, or several single files)
  app.post("/api/models", async (request, reply) => {
    const parts = request.parts();
    let name: string | undefined;
    let description: string | undefined;
    let categoryId: number | undefined;
    let sourceUrl: string | undefined;
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
        if (part.fieldname === "tags" && part.value) {
          tags = String(part.value)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }
    }

    if (!name) return reply.code(400).send({ error: "name is required" });
    if (fileUploads.length === 0) return reply.code(400).send({ error: "at least one file is required" });

    const modelId = createModel({ name, description, categoryId, sourceUrl });
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
      tags?: string[];
    };
    if (!getModelDetail(id)) return reply.code(404).send({ error: "Model not found" });

    updateModel(id, {
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      sourceUrl: body.sourceUrl,
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

  app.delete("/api/models/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!getModelDetail(id)) return reply.code(404).send({ error: "Model not found" });
    deleteModel(id);
    fs.rmSync(path.join(MODELS_DIR, String(id)), { recursive: true, force: true });
    return reply.code(204).send();
  });
}
