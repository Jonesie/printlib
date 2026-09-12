import type { FastifyInstance } from "fastify";
import { createCategory, listCategories } from "../db/queries.js";

export default async function categoriesRoutes(app: FastifyInstance) {
  app.get("/api/categories", async () => listCategories());

  app.post("/api/categories", async (request, reply) => {
    const body = request.body as { name?: string };
    if (!body.name?.trim()) return reply.code(400).send({ error: "name is required" });
    return reply.code(201).send(createCategory(body.name.trim()));
  });
}
