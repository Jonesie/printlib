import { beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { defaultPostText, graphemeLength } from "../lib/bluesky.js";

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
    expect(res.json()).toEqual({ bluesky: false });
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
