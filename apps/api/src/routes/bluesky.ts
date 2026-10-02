import type { FastifyInstance } from "fastify";
import { getModelDetail, getPrintLog } from "../db/queries.js";
import {
  MAX_POST_GRAPHEMES,
  defaultPostText,
  graphemeLength,
  isBlueskyConfigured,
  modelUrl,
  postToBluesky,
} from "../lib/bluesky.js";

export default async function blueskyRoutes(app: FastifyInstance) {
  app.get("/api/integrations", async () => ({ bluesky: isBlueskyConfigured() }));

  // Suggested post text for a print log, so the UI can show an editable draft.
  app.get("/api/print-logs/:id/share-draft", async (request, reply) => {
    const log = getPrintLog(Number((request.params as { id: string }).id));
    const model = log && getModelDetail(log.modelId);
    if (!log || !model) return reply.code(404).send({ error: "Print log not found" });
    const url = modelUrl(model.id);
    const text = defaultPostText({ ...log, modelName: model.name });
    const withLink = url ? `${text}\n\n${url}` : text;
    return { text: graphemeLength(withLink) <= MAX_POST_GRAPHEMES ? withLink : text.slice(0, MAX_POST_GRAPHEMES) };
  });

  // Body: { text } — the (possibly user-edited) post text.
  app.post("/api/print-logs/:id/share/bluesky", async (request, reply) => {
    if (!isBlueskyConfigured()) return reply.code(400).send({ error: "Bluesky is not configured" });
    const log = getPrintLog(Number((request.params as { id: string }).id));
    if (!log) return reply.code(404).send({ error: "Print log not found" });

    const text = String((request.body as { text?: unknown } | null)?.text ?? "").trim();
    if (!text) return reply.code(400).send({ error: "text is required" });
    if (graphemeLength(text) > MAX_POST_GRAPHEMES) {
      return reply.code(400).send({ error: `Post is longer than ${MAX_POST_GRAPHEMES} characters` });
    }

    try {
      return await postToBluesky(text, log.photoFilename);
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : "Bluesky post failed" });
    }
  });
}
