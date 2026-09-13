import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { getProfile, saveProfile } from "../db/queries.js";
import { AVATARS_DIR } from "../config.js";

async function readPart(part: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of part) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function profileRoutes(app: FastifyInstance) {
  app.get("/api/profile", async () => getProfile());

  // multipart/form-data: name (required), location?, note?, email?, phone?,
  // socialLinks? (JSON string of {label,url}[]), avatar? (image file)
  app.put("/api/profile", async (request, reply) => {
    const parts = request.parts();
    let name: string | undefined;
    let location: string | undefined;
    let note: string | undefined;
    let email: string | undefined;
    let phone: string | undefined;
    let socialLinks: { label: string; url: string }[] | undefined;
    let avatarFilename: string | undefined;

    for await (const part of parts) {
      if (part.type === "file") {
        if (part.fieldname === "avatar" && part.filename) {
          const ext = part.filename.split(".").pop() || "jpg";
          const storedName = `${crypto.randomUUID()}.${ext}`;
          fs.writeFileSync(path.join(AVATARS_DIR, storedName), await readPart(part.file));
          avatarFilename = storedName;
        }
      } else {
        if (part.fieldname === "name") name = String(part.value);
        if (part.fieldname === "location") location = String(part.value);
        if (part.fieldname === "note") note = String(part.value);
        if (part.fieldname === "email") email = String(part.value);
        if (part.fieldname === "phone") phone = String(part.value);
        if (part.fieldname === "socialLinks") {
          try {
            socialLinks = JSON.parse(String(part.value));
          } catch {
            socialLinks = [];
          }
        }
      }
    }

    if (!name?.trim()) return reply.code(400).send({ error: "name is required" });

    return saveProfile({ name: name.trim(), location, note, email, phone, socialLinks, avatarFilename });
  });

  app.get("/api/profile-avatar/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const safe = path.basename(filename);
    const filePath = path.join(AVATARS_DIR, safe);
    if (!fs.existsSync(filePath)) return reply.code(404).send({ error: "Not found" });
    return reply.send(fs.createReadStream(filePath));
  });
}
