import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { PRINT_LOGS_DIR } from "../config.js";
import { buildApp } from "../app.js";
import { MAX_IMAGE_BYTES, defaultPostText, fitImageForBluesky, graphemeLength } from "../lib/bluesky.js";

const app = buildApp();
let sessionCookie: string;

beforeAll(async () => {
  const res = await app.inject({ method: "POST", url: "/api/login", payload: { password: "test-password" } });
  sessionCookie = res.cookies.find((c) => c.name === "printlib_session")!.value;
});

async function createLog() {
  const boundary = "----b";
  const modelBody =
    `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nBenchy\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.stl"\r\nContent-Type: application/octet-stream\r\n\r\nAAA\r\n--${boundary}--\r\n`;
  const headers = { "content-type": `multipart/form-data; boundary=${boundary}` };
  const cookies = { printlib_session: sessionCookie };
  const model = (await app.inject({ method: "POST", url: "/api/models", headers, payload: modelBody, cookies })).json();
  const logBody =
    `--${boundary}\r\nContent-Disposition: form-data; name="success"\r\n\r\ntrue\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="material"\r\n\r\nPLA\r\n--${boundary}--\r\n`;
  const detail = (
    await app.inject({ method: "POST", url: `/api/models/${model.id}/print-logs`, headers, payload: logBody, cookies })
  ).json();
  return detail.printLogs[0].id as number;
}

describe("bluesky sharing (unconfigured)", () => {
  it("reports the integration as disabled", async () => {
    const res = await app.inject({ method: "GET", url: "/api/integrations" });
    expect(res.json()).toEqual({ bluesky: false, facebook: false, instagram: false });
  });

  it("requires a session to share", async () => {
    const res = await app.inject({ method: "POST", url: "/api/print-logs/1/share/bluesky", payload: { text: "hi" } });
    expect(res.statusCode).toBe(401);
  });

  it("rejects sharing when not configured", async () => {
    const id = await createLog();
    const res = await app.inject({
      method: "POST",
      url: `/api/print-logs/${id}/share/bluesky`,
      payload: { text: "hi" },
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns a draft built from the log", async () => {
    const id = await createLog();
    const res = await app.inject({ method: "GET", url: `/api/print-logs/${id}/share-draft` });
    expect(res.json().text).toBe("Printed Benchy (PLA)");
  });
});

describe("bluesky helpers", () => {
  it("builds post text from details", () => {
    expect(
      defaultPostText({ modelName: "Vase", success: false, notes: "Warped", printerName: "Ender", material: "PETG" }),
    ).toBe("Print failed: Vase (Ender · PETG)\n\nWarped");
  });

  it("counts graphemes, not UTF-16 units", () => {
    expect(graphemeLength("a👨‍👩‍👧b")).toBe(3);
  });
});

describe("other sites (unconfigured)", () => {
  it.each(["facebook", "instagram"])("rejects sharing to %s when not configured", async (site) => {
    const id = await createLog();
    const res = await app.inject({
      method: "POST",
      url: `/api/print-logs/${id}/share/${site}`,
      payload: { text: "hi" },
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/not configured/);
  });

  it("404s for an unknown site", async () => {
    const id = await createLog();
    const res = await app.inject({
      method: "POST",
      url: `/api/print-logs/${id}/share/myspace`,
      payload: { text: "hi" },
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it("serves a print log photo converted to JPEG for Instagram", async () => {
    const png = await sharp({ create: { width: 20, height: 20, channels: 4, background: "#f00" } }).png().toBuffer();
    fs.mkdirSync(PRINT_LOGS_DIR, { recursive: true });
    fs.writeFileSync(path.join(PRINT_LOGS_DIR, "ig-test.png"), png);
    const res = await app.inject({ method: "GET", url: "/api/print-log-photos/ig-test.png?format=jpeg" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect((await sharp(res.rawPayload).metadata()).format).toBe("jpeg");
  });
});

describe("fitImageForBluesky", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bsky-img-"));

  async function noisyPng(file: string, size: number) {
    const raw = crypto.randomBytes(size * size * 3);
    await sharp(raw, { raw: { width: size, height: size, channels: 3 } }).png().toFile(file);
    return file;
  }

  it("leaves a small photo untouched", async () => {
    const file = await noisyPng(path.join(dir, "small.png"), 100);
    const out = await fitImageForBluesky(file, "image/png");
    expect(out?.mime).toBe("image/png");
    expect(out?.data.equals(fs.readFileSync(file))).toBe(true);
  });

  it("shrinks an oversized photo to a JPEG under the limit", async () => {
    const file = await noisyPng(path.join(dir, "big.png"), 1500);
    expect(fs.statSync(file).size).toBeGreaterThan(MAX_IMAGE_BYTES);
    const out = await fitImageForBluesky(file, "image/png");
    expect(out?.mime).toBe("image/jpeg");
    expect(out!.data.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });

  it("returns null for an unreadable image", async () => {
    const file = path.join(dir, "bad.png");
    fs.writeFileSync(file, Buffer.alloc(MAX_IMAGE_BYTES + 10, 1));
    expect(await fitImageForBluesky(file, "image/png")).toBeNull();
  });
});
