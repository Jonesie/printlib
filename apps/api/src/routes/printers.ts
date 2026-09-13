import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { createPrinter, deletePrinter, getPrinterRaw, listPrinters, updatePrinter } from "../db/queries.js";
import { PRINTERS_DIR } from "../config.js";

async function readPart(part: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of part) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function savePhoto(filename: string, buffer: Buffer): string {
  const ext = filename.split(".").pop() || "jpg";
  const storedName = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(PRINTERS_DIR, storedName), buffer);
  return storedName;
}

export default async function printersRoutes(app: FastifyInstance) {
  app.get("/api/printers", async () => listPrinters());

  // multipart/form-data: name, model?, purchasedAt? (YYYY-MM-DD), price?, notes?, photo? (image file)
  app.post("/api/printers", async (request, reply) => {
    const parts = request.parts();
    let name: string | undefined;
    let model: string | undefined;
    let purchasedAt: string | undefined;
    let price: number | undefined;
    let notes: string | undefined;
    let photoFilename: string | undefined;

    for await (const part of parts) {
      if (part.type === "file") {
        if (part.fieldname === "photo" && part.filename) {
          photoFilename = savePhoto(part.filename, await readPart(part.file));
        }
      } else {
        if (part.fieldname === "name") name = String(part.value);
        if (part.fieldname === "model") model = String(part.value);
        if (part.fieldname === "purchasedAt") purchasedAt = String(part.value);
        if (part.fieldname === "price" && part.value !== "") price = Number(part.value);
        if (part.fieldname === "notes") notes = String(part.value);
      }
    }

    if (!name?.trim()) return reply.code(400).send({ error: "name is required" });

    return reply
      .code(201)
      .send(createPrinter({ name: name.trim(), model, purchasedAt, price, notes, photoFilename }));
  });

  // multipart/form-data, same fields as create; photo only replaced if a new one is sent
  app.patch("/api/printers/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!getPrinterRaw(id)) return reply.code(404).send({ error: "Printer not found" });

    const parts = request.parts();
    let name: string | undefined;
    let model: string | undefined;
    let purchasedAt: string | undefined;
    let price: number | undefined;
    let notes: string | undefined;
    let photoFilename: string | undefined;

    for await (const part of parts) {
      if (part.type === "file") {
        if (part.fieldname === "photo" && part.filename) {
          photoFilename = savePhoto(part.filename, await readPart(part.file));
        }
      } else {
        if (part.fieldname === "name") name = String(part.value);
        if (part.fieldname === "model") model = String(part.value);
        if (part.fieldname === "purchasedAt") purchasedAt = String(part.value);
        if (part.fieldname === "price" && part.value !== "") price = Number(part.value);
        if (part.fieldname === "notes") notes = String(part.value);
      }
    }

    return updatePrinter(id, { name, model, purchasedAt, price, notes, photoFilename });
  });

  app.delete("/api/printers/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    deletePrinter(id);
    return reply.code(204).send();
  });

  app.get("/api/printer-photos/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const safe = path.basename(filename);
    const filePath = path.join(PRINTERS_DIR, safe);
    if (!fs.existsSync(filePath)) return reply.code(404).send({ error: "Not found" });
    return reply.send(fs.createReadStream(filePath));
  });
}
