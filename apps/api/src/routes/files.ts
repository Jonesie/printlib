import fs from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { getModelFile } from "../db/queries.js";
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
