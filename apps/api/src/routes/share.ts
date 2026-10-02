import type { FastifyInstance } from "fastify";
import { getModelDetail, getPrintLog } from "../db/queries.js";
import { defaultPostText, modelUrl } from "../lib/bluesky.js";
import { SITES, SITE_CONFIG, graphemeLength, isSite } from "../lib/social.js";

export default async function shareRoutes(app: FastifyInstance) {
  // Which sharing integrations are configured, e.g. { bluesky: true, facebook: false, ... }.
  app.get("/api/integrations", async () =>
    Object.fromEntries(SITES.map((site) => [site, SITE_CONFIG[site].configured()])),
  );

  // Suggested post text for a print log, so the UI can show an editable draft.
  app.get("/api/print-logs/:id/share-draft", async (request, reply) => {
    const log = getPrintLog(Number((request.params as { id: string }).id));
    const model = log && getModelDetail(log.modelId);
    if (!log || !model) return reply.code(404).send({ error: "Print log not found" });
    const site = String((request.query as { site?: string }).site ?? "bluesky");
    if (!isSite(site)) return reply.code(404).send({ error: "Unknown site" });
    const { maxChars } = SITE_CONFIG[site];
    const url = modelUrl(model.id);
    const text = defaultPostText({ ...log, modelName: model.name });
    const withLink = url ? `${text}\n\n${url}` : text;
    return { text: graphemeLength(withLink) <= maxChars ? withLink : text.slice(0, maxChars) };
  });

  // Body: { text } — the (possibly user-edited) post text.
  app.post("/api/print-logs/:id/share/:site", async (request, reply) => {
    const { id, site } = request.params as { id: string; site: string };
    if (!isSite(site)) return reply.code(404).send({ error: "Unknown site" });
    const config = SITE_CONFIG[site];
    if (!config.configured()) return reply.code(400).send({ error: `${config.label} is not configured` });
    const log = getPrintLog(Number(id));
    if (!log) return reply.code(404).send({ error: "Print log not found" });
    if (config.needsPhoto && !log.photoFilename) {
      return reply.code(400).send({ error: `${config.label} posts need a photo` });
    }

    const text = String((request.body as { text?: unknown } | null)?.text ?? "").trim();
    if (!text) return reply.code(400).send({ error: "text is required" });
    if (graphemeLength(text) > config.maxChars) {
      return reply.code(400).send({ error: `Post is longer than ${config.maxChars} characters` });
    }

    try {
      return await config.post(text, log.photoFilename);
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : `${config.label} post failed` });
    }
  });
}
