import type { FastifyInstance } from "fastify";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../db/queries.js";

export default async function categoriesRoutes(app: FastifyInstance) {
  app.get("/api/categories", async () => listCategories());

  app.post("/api/categories", async (request, reply) => {
    const body = request.body as { name?: string };
    if (!body.name?.trim()) return reply.code(400).send({ error: "name is required" });
    return reply.code(201).send(createCategory(body.name.trim()));
  });

  app.patch("/api/categories/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const body = request.body as { name?: string };
    if (!body.name?.trim()) return reply.code(400).send({ error: "name is required" });
    try {
      return updateCategory(id, body.name.trim());
    } catch (err: any) {
      if (String(err.message).includes("UNIQUE")) {
        return reply.code(409).send({ error: "A category with that name already exists" });
      }
      throw err;
    }
  });

  app.delete("/api/categories/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    deleteCategory(id);
    return reply.code(204).send();
  });
}
