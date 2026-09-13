import crypto from "node:crypto";

// Whole-app session auth, same shape as this user's other personal
// internet-facing apps (mirage, pix): a single shared password, a signed
// timed cookie, no user accounts. Unlike those apps (which are public with
// an admin-only gate), PrintLib has no public part — everything requires a
// session.
export const SESSION_COOKIE = "printlib_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET environment variable must be set");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret!).update(payload).digest("base64url");
}

export function makeSessionToken(): string {
  const payload = Buffer.from(JSON.stringify({ ts: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const { ts } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof ts === "number" && Date.now() - ts < SESSION_MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD environment variable must be set");
  }
  // Hash both sides to a fixed length first so timingSafeEqual never throws
  // on a length mismatch (which would itself leak a comparison result).
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
