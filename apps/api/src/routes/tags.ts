import type { FastifyInstance } from "fastify";
import { findOrCreateTag, listTags } from "../db/queries.js";

export default async function tagsRoutes(app: FastifyInstance) {
  app.get("/api/tags", async () => listTags());

  app.post("/api/tags", async (request, reply) => {
    const body = request.body as { name?: string };
    if (!body.name?.trim()) return reply.code(400).send({ error: "name is required" });
    return reply.code(201).send(findOrCreateTag(body.name.trim()));
  });
}
