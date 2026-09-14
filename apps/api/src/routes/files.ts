import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import type { FastifyInstance } from "fastify";
import { deleteModelFile, getModelDetail, getModelFile } from "../db/queries.js";
import { PREVIEWS_DIR, PRINT_LOGS_DIR } from "../config.js";

export default async function filesRoutes(app: FastifyInstance) {
  app.get("/api/files/:id/download", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const file = getModelFile(id);
    if (!file || !fs.existsSync(file.storedPath)) {
      return reply.code(404).send({ error: "File not found" });
    }
    reply.header("Content-Disposition", `attachment; filename="${encodeURIComponent(file.filename)}"`);
    return reply.send(fs.createReadStream(file.storedPath));
  });

  app.delete("/api/files/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const file = getModelFile(id);
    if (!file) return reply.code(404).send({ error: "File not found" });

    const model = getModelDetail(file.modelId);
    if (!model) return reply.code(404).send({ error: "Model not found" });
    if (model.files.length <= 1 && !model.sourceUrl) {
      return reply.code(400).send({ error: "a model needs at least a source URL or files" });
    }

    deleteModelFile(id);
    if (fs.existsSync(file.storedPath)) fs.unlinkSync(file.storedPath);
    return getModelDetail(file.modelId);
  });

  app.get("/api/models/:id/download", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const model = getModelDetail(id);
    if (!model) return reply.code(404).send({ error: "Model not found" });
    if (model.files.length === 0) return reply.code(404).send({ error: "This model has no files" });

    const zip = new AdmZip();
    for (const file of model.files) {
      const stored = getModelFile(file.id);
      if (stored && fs.existsSync(stored.storedPath)) {
        zip.addLocalFile(stored.storedPath, "", file.filename);
      }
    }

    const safeName = model.name.replace(/[^a-z0-9_\- ]/gi, "_").trim() || "model";
    reply.header("Content-Type", "application/zip");
    reply.header("Content-Disposition", `attachment; filename="${encodeURIComponent(safeName)}.zip"`);
    return reply.send(zip.toBuffer());
  });

  app.get("/api/print-log-photos/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const safe = path.basename(filename);
    const filePath = path.join(PRINT_LOGS_DIR, safe);
    if (!fs.existsSync(filePath)) return reply.code(404).send({ error: "Not found" });
    return reply.send(fs.createReadStream(filePath));
  });

  app.get("/api/previews/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const safe = path.basename(filename);
    const filePath = path.join(PREVIEWS_DIR, safe);
    if (!fs.existsSync(filePath)) return reply.code(404).send({ error: "Not found" });
    return reply.send(fs.createReadStream(filePath));
  });
}
