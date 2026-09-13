import type { FastifyInstance } from "fastify";
import { createSiteLink, deleteSiteLink, listSiteLinks, updateSiteLink } from "../db/queries.js";

export default async function siteLinksRoutes(app: FastifyInstance) {
  app.get("/api/site-links", async () => listSiteLinks());

  app.post("/api/site-links", async (request, reply) => {
    const body = request.body as { name?: string; url?: string };
    if (!body.name?.trim() || !body.url?.trim()) {
      return reply.code(400).send({ error: "name and url are required" });
    }
    return reply.code(201).send(createSiteLink(body.name.trim(), body.url.trim()));
  });

  app.patch("/api/site-links/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const body = request.body as { name?: string; url?: string };
    try {
      return updateSiteLink(id, { name: body.name?.trim(), url: body.url?.trim() });
    } catch {
      return reply.code(404).send({ error: "Site link not found" });
    }
  });

  app.delete("/api/site-links/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    deleteSiteLink(id);
    return reply.code(204).send();
  });
}
