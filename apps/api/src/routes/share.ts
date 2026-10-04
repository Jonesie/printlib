import type { FastifyInstance } from "fastify";
import { getModelDetail, getPrintLog } from "../db/queries.js";
import { defaultPostText, modelUrl } from "../lib/bluesky.js";
import { SITES, SITE_CONFIG, graphemeLength, isSite } from "../lib/social.js";

// "Source: <url>" for a model's source link, or null when it has no http(s) URL.
function sourceLine(sourceUrl: string | null | undefined): string | null {
  if (!sourceUrl) return null;
  try {
    const { protocol } = new URL(sourceUrl);
    return protocol === "http:" || protocol === "https:" ? `Source: ${sourceUrl}` : null;
  } catch {
    return null;
  }
}

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
    const source = sourceLine(model.sourceUrl);
    // The source is appended separately (and can't be edited), so reserve room for it.
    const budget = maxChars - (source ? graphemeLength(`\n\n${source}`) : 0);
    const url = modelUrl(model.id);
    const text = defaultPostText({ ...log, modelName: model.name });
    const withLink = url ? `${text}\n\n${url}` : text;
    return {
      text: graphemeLength(withLink) <= budget ? withLink : text.slice(0, budget),
      source,
      maxChars,
    };
  });

  // Body: { text, includeSource? } — the (possibly user-edited) post text; the
  // model's source link is appended server-side when includeSource is true.
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

    const body = (request.body as { text?: unknown; includeSource?: unknown } | null) ?? {};
    let text = String(body.text ?? "").trim();
    if (!text) return reply.code(400).send({ error: "text is required" });
    if (body.includeSource === true) {
      const source = sourceLine(getModelDetail(log.modelId)?.sourceUrl);
      if (source) text = `${text}\n\n${source}`;
    }
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
