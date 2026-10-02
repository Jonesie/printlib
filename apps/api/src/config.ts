import path from "node:path";

export const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), "data");
export const MODELS_DIR = path.join(DATA_DIR, "models");
export const PRINT_LOGS_DIR = path.join(DATA_DIR, "print-logs");
export const PREVIEWS_DIR = path.join(DATA_DIR, "previews");
export const PRINTERS_DIR = path.join(DATA_DIR, "printers");
export const AVATARS_DIR = path.join(DATA_DIR, "avatars");
export const DB_PATH = path.join(DATA_DIR, "printlib.sqlite");

export const PORT = Number(process.env.PORT ?? 8000);
export const HOST = process.env.HOST ?? "0.0.0.0";

// "dev" for local/from-source builds; the release image bakes in the git tag.
export const APP_VERSION = process.env.APP_VERSION ?? "dev";

// Set when the frontend build should be served by this process (production).
export const WEB_DIST_DIR = process.env.WEB_DIST_DIR ?? null;

// Optional Bluesky sharing: an app password (Settings → Privacy and security →
// App passwords in Bluesky), never the account password. Sharing is disabled
// unless both handle and app password are set.
export const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE ?? null;
export const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD ?? null;
export const BLUESKY_SERVICE = (process.env.BLUESKY_SERVICE ?? "https://bsky.social").replace(/\/$/, "");
// Public base URL of this site (e.g. https://printlib.example.com); when set,
// shared posts link back to the model page.
export const PUBLIC_URL = process.env.PUBLIC_URL?.replace(/\/$/, "") ?? null;
