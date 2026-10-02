import fs from "node:fs";
import path from "node:path";
import { FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID, PRINT_LOGS_DIR } from "../config.js";
import { graph } from "./graph.js";
import type { SharedPost } from "./bluesky.js";

export const FACEBOOK_MAX_CHARS = 5000;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export function isFacebookConfigured(): boolean {
  return Boolean(FACEBOOK_PAGE_ID && FACEBOOK_PAGE_ACCESS_TOKEN);
}

// Posts to the configured Page: a photo post when the log has a usable photo,
// otherwise a plain text post.
export async function postToFacebook(text: string, photoFilename: string | null): Promise<SharedPost> {
  if (!isFacebookConfigured()) throw new Error("Facebook is not configured");

  const form = new FormData();
  form.set("access_token", FACEBOOK_PAGE_ACCESS_TOKEN!);

  let imageSkipped = false;
  let edge = "feed";
  if (photoFilename) {
    const file = path.join(PRINT_LOGS_DIR, path.basename(photoFilename));
    const mime = MIME_BY_EXT[path.extname(file).slice(1).toLowerCase()];
    if (mime && fs.existsSync(file)) {
      edge = "photos";
      form.set("caption", text);
      form.set("source", new Blob([new Uint8Array(fs.readFileSync(file))], { type: mime }), path.basename(file));
    } else {
      imageSkipped = true;
    }
  }
  if (edge === "feed") form.set("message", text);

  const res = await graph<{ id: string; post_id?: string }>(`${FACEBOOK_PAGE_ID}/${edge}`, {
    method: "POST",
    body: form,
  });
  const postId = res.post_id ?? res.id;
  return { uri: postId, url: `https://www.facebook.com/${postId}`, imageSkipped };
}
