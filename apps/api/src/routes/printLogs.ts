import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { addPrintLog, deletePrintLog, getModelDetail, getPrintLog, updatePrintLog } from "../db/queries.js";
import { PRINT_LOGS_DIR } from "../config.js";

// The frontend sends a full ISO instant (the chosen calendar date combined
// with the current time-of-day, computed in the browser's own timezone) —
// the server just stores it as-is rather than guessing what timezone a bare
// date string was meant in.
function toCreatedAt(date: string | undefined): string | null {
  return date ?? null;
}

async function readPart(part: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of part) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function savePhoto(filename: string, buffer: Buffer): string {
  const ext = filename.split(".").pop() ?? "jpg";
  const storedName = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(PRINT_LOGS_DIR, storedName), buffer);
  return storedName;
}

export default async function printLogsRoutes(app: FastifyInstance) {
  // multipart/form-data: success ("true"/"false"), date? (YYYY-MM-DD, defaults to now),
  // notes?, printerName?, material?, photo? (image file)
  app.post("/api/models/:id/print-logs", async (request, reply) => {
    const modelId = Number((request.params as { id: string }).id);
    if (!getModelDetail(modelId)) return reply.code(404).send({ error: "Model not found" });

    const parts = request.parts();
    let success = true;
    let notes: string | undefined;
    let printerName: string | undefined;
    let material: string | undefined;
    let date: string | undefined;
    let photoFilename: string | null = null;

    for await (const part of parts) {
      if (part.type === "file") {
        if (part.fieldname === "photo" && part.filename) {
          photoFilename = savePhoto(part.filename, await readPart(part.file));
        }
      } else {
        if (part.fieldname === "success") success = part.value === "true";
        if (part.fieldname === "notes") notes = String(part.value);
        if (part.fieldname === "printerName") printerName = String(part.value);
        if (part.fieldname === "material") material = String(part.value);
        if (part.fieldname === "date") date = String(part.value);
      }
    }

    addPrintLog({ modelId, success, notes, photoFilename, printerName, material, createdAt: toCreatedAt(date) });
    return reply.code(201).send(getModelDetail(modelId));
  });

  // multipart/form-data, same fields as create; photo only replaced if a new one is sent
  app.patch("/api/print-logs/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const existing = getPrintLog(id);
    if (!existing) return reply.code(404).send({ error: "Print log not found" });

    const parts = request.parts();
    let success: boolean | undefined;
    let notes: string | undefined;
    let printerName: string | undefined;
    let material: string | undefined;
    let date: string | undefined;
    let photoFilename: string | undefined;

    for await (const part of parts) {
      if (part.type === "file") {
        if (part.fieldname === "photo" && part.filename) {
          photoFilename = savePhoto(part.filename, await readPart(part.file));
        }
      } else {
        if (part.fieldname === "success") success = part.value === "true";
        if (part.fieldname === "notes") notes = String(part.value);
        if (part.fieldname === "printerName") printerName = String(part.value);
        if (part.fieldname === "material") material = String(part.value);
        if (part.fieldname === "date") date = String(part.value);
      }
    }

    updatePrintLog(id, {
      success,
      notes,
      printerName,
      material,
      photoFilename,
      createdAt: toCreatedAt(date) ?? undefined,
    });
    return getModelDetail(existing.modelId);
  });

  app.delete("/api/print-logs/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const existing = getPrintLog(id);
    if (!existing) return reply.code(404).send({ error: "Print log not found" });
    deletePrintLog(id);
    return getModelDetail(existing.modelId);
  });
}
