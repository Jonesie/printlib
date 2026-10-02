import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { BLUESKY_APP_PASSWORD, BLUESKY_HANDLE, BLUESKY_SERVICE, PRINT_LOGS_DIR, PUBLIC_URL } from "../config.js";

export const MAX_POST_GRAPHEMES = 300;
// Bluesky rejects image blobs larger than this.
export const MAX_IMAGE_BYTES = 976_560;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

// Returns the photo as-is when it already fits, otherwise re-encodes it as a
// JPEG (honouring EXIF rotation), shrinking until it is under Bluesky's limit.
export async function fitImageForBluesky(
  file: string,
  mime: string,
): Promise<{ data: Buffer; mime: string } | null> {
  const original = fs.readFileSync(file);
  if (original.length <= MAX_IMAGE_BYTES) return { data: original, mime };
  try {
    for (const edge of [2000, 1600, 1280, 1024, 800]) {
      for (const quality of [85, 70, 55]) {
        const data = await sharp(original)
          .rotate()
          .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
          .flatten({ background: "#ffffff" })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
        if (data.length <= MAX_IMAGE_BYTES) return { data, mime: "image/jpeg" };
      }
    }
  } catch {
    // unreadable or unsupported image (e.g. animated GIF edge cases) — post without it
  }
  return null;
}

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
    const image = mime && fs.existsSync(file) ? await fitImageForBluesky(file, mime) : null;
    if (image) {
      const { blob } = await xrpc<{ blob: unknown }>("com.atproto.repo.uploadBlob", new Uint8Array(image.data), {
        ...auth,
        "Content-Type": image.mime,
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
