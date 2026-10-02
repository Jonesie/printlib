import fs from "node:fs";
import path from "node:path";
import { BLUESKY_APP_PASSWORD, BLUESKY_HANDLE, BLUESKY_SERVICE, PRINT_LOGS_DIR, PUBLIC_URL } from "../config.js";

export const MAX_POST_GRAPHEMES = 300;
// Bluesky rejects image blobs larger than this.
const MAX_IMAGE_BYTES = 976_560;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export function isBlueskyConfigured(): boolean {
  return Boolean(BLUESKY_HANDLE && BLUESKY_APP_PASSWORD);
}

export function graphemeLength(text: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
}

export function defaultPostText(input: {
  modelName: string;
  success: boolean;
  notes: string | null;
  printerName: string | null;
  material: string | null;
}): string {
  const head = `${input.success ? "Printed" : "Print failed:"} ${input.modelName}`;
  const detail = [input.printerName, input.material].filter(Boolean).join(" · ");
  const parts = [head + (detail ? ` (${detail})` : ""), input.notes].filter(Boolean) as string[];
  return parts.join("\n\n");
}

export function modelUrl(modelId: number): string | null {
  return PUBLIC_URL ? `${PUBLIC_URL}/models/${modelId}` : null;
}

// Facets are indexed by UTF-8 byte offsets, not characters.
function linkFacets(text: string) {
  const facets: unknown[] = [];
  const enc = new TextEncoder();
  for (const m of text.matchAll(/https?:\/\/[^\s]+/g)) {
    const start = enc.encode(text.slice(0, m.index)).length;
    facets.push({
      index: { byteStart: start, byteEnd: start + enc.encode(m[0]).length },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }],
    });
  }
  return facets;
}

async function xrpc<T>(method: string, body: BodyInit, headers: Record<string, string>): Promise<T> {
  const res = await fetch(`${BLUESKY_SERVICE}/xrpc/${method}`, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Bluesky request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface SharedPost {
  uri: string;
  url: string;
  imageSkipped: boolean;
}

export async function postToBluesky(text: string, photoFilename: string | null): Promise<SharedPost> {
  if (!isBlueskyConfigured()) throw new Error("Bluesky is not configured");

  const session = await xrpc<{ accessJwt: string; did: string }>(
    "com.atproto.server.createSession",
    JSON.stringify({ identifier: BLUESKY_HANDLE, password: BLUESKY_APP_PASSWORD }),
    { "Content-Type": "application/json" },
  );
  const auth = { Authorization: `Bearer ${session.accessJwt}` };

  let embed: unknown;
  let imageSkipped = false;
  if (photoFilename) {
    const file = path.join(PRINT_LOGS_DIR, path.basename(photoFilename));
    const mime = MIME_BY_EXT[path.extname(file).slice(1).toLowerCase()];
    if (mime && fs.existsSync(file) && fs.statSync(file).size <= MAX_IMAGE_BYTES) {
      const { blob } = await xrpc<{ blob: unknown }>("com.atproto.repo.uploadBlob", fs.readFileSync(file), {
        ...auth,
        "Content-Type": mime,
      });
      embed = { $type: "app.bsky.embed.images", images: [{ alt: "Print result", image: blob }] };
    } else {
      imageSkipped = true;
    }
  }

  const record = {
    $type: "app.bsky.feed.post",
    text,
    facets: linkFacets(text),
    createdAt: new Date().toISOString(),
    ...(embed ? { embed } : {}),
  };
  const created = await xrpc<{ uri: string }>(
    "com.atproto.repo.createRecord",
    JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
    { ...auth, "Content-Type": "application/json" },
  );
  const rkey = created.uri.split("/").pop();
  return { uri: created.uri, url: `https://bsky.app/profile/${BLUESKY_HANDLE}/post/${rkey}`, imageSkipped };
}
