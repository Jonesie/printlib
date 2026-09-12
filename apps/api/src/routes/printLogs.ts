import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { addPrintLog, getModelDetail } from "../db/queries.js";
import { PRINT_LOGS_DIR } from "../config.js";

export default async function printLogsRoutes(app: FastifyInstance) {
  // multipart/form-data: success ("true"/"false"), notes?, printerName?, material?, photo? (image file)
  app.post("/api/models/:id/print-logs", async (request, reply) => {
    const modelId = Number((request.params as { id: string }).id);
    if (!getModelDetail(modelId)) return reply.code(404).send({ error: "Model not found" });

    const parts = request.parts();
    let success = true;
    let notes: string | undefined;
    let printerName: string | undefined;
    let material: string | undefined;
    let photoFilename: string | null = null;

    for await (const part of parts) {
      if (part.type === "file") {
        if (part.fieldname === "photo" && part.filename) {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) chunks.push(chunk);
          const buffer = Buffer.concat(chunks);
          const ext = part.filename.split(".").pop() ?? "jpg";
          const storedName = `${crypto.randomUUID()}.${ext}`;
          fs.mkdirSync(PRINT_LOGS_DIR, { recursive: true });
          fs.writeFileSync(path.join(PRINT_LOGS_DIR, storedName), buffer);
          photoFilename = storedName;
        }
      } else {
        if (part.fieldname === "success") success = part.value === "true";
        if (part.fieldname === "notes") notes = String(part.value);
        if (part.fieldname === "printerName") printerName = String(part.value);
        if (part.fieldname === "material") material = String(part.value);
      }
    }

    addPrintLog({ modelId, success, notes, photoFilename, printerName, material });
    return reply.code(201).send(getModelDetail(modelId));
  });
}
