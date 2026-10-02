import { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID, PUBLIC_URL } from "../config.js";
import { graph } from "./graph.js";
import type { SharedPost } from "./bluesky.js";

export const INSTAGRAM_MAX_CHARS = 2200;

export function isInstagramConfigured(): boolean {
  return Boolean(INSTAGRAM_ACCOUNT_ID && INSTAGRAM_ACCESS_TOKEN && PUBLIC_URL);
}

// Instagram can't take an upload: it downloads the image from a public URL,
// and only accepts JPEG, so we point it at the JPEG-converting photo route.
export function instagramImageUrl(photoFilename: string): string {
  return `${PUBLIC_URL}/api/print-log-photos/${encodeURIComponent(photoFilename)}?format=jpeg`;
}

function form(fields: Record<string, string>): URLSearchParams {
  return new URLSearchParams({ ...fields, access_token: INSTAGRAM_ACCESS_TOKEN! });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function postToInstagram(text: string, photoFilename: string | null): Promise<SharedPost> {
  if (!isInstagramConfigured()) throw new Error("Instagram is not configured");
  if (!photoFilename) throw new Error("Instagram posts need a photo");

  const container = await graph<{ id: string }>(`${INSTAGRAM_ACCOUNT_ID}/media`, {
    method: "POST",
    body: form({ image_url: instagramImageUrl(photoFilename), caption: text }),
  });

  // Instagram processes the image asynchronously; wait until it is ready.
  for (let i = 0; i < 10; i++) {
    const { status_code } = await graph<{ status_code?: string }>(container.id, {
      query: { fields: "status_code", access_token: INSTAGRAM_ACCESS_TOKEN! },
    });
    if (status_code === "FINISHED" || status_code === undefined) break;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error("Instagram could not process the photo (is PUBLIC_URL reachable from the internet?)");
    }
    await sleep(1500);
  }

  const published = await graph<{ id: string }>(`${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
    method: "POST",
    body: form({ creation_id: container.id }),
  });
  const { permalink } = await graph<{ permalink?: string }>(published.id, {
    query: { fields: "permalink", access_token: INSTAGRAM_ACCESS_TOKEN! },
  }).catch(() => ({ permalink: undefined }));
  return { uri: published.id, url: permalink ?? "https://www.instagram.com/", imageSkipped: false };
}
