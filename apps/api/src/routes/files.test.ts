import AdmZip from "adm-zip";
import { beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

const app = buildApp();
let sessionCookie: string;

beforeAll(async () => {
  const res = await app.inject({ method: "POST", url: "/api/login", payload: { password: "test-password" } });
  sessionCookie = res.cookies.find((c) => c.name === "printlib_session")!.value;
});

function multipart(fields: Record<string, string>, files: { field: string; filename: string; content: string }[] = []) {
  const boundary = "----printlib-test-boundary";
  let body = "";
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
  }
  for (const f of files) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${f.field}"; filename="${f.filename}"\r\nContent-Type: application/octet-stream\r\n\r\n${f.content}\r\n`;
  }
  body += `--${boundary}--\r\n`;
  return { body, headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

async function createModel(fields: Record<string, string>, files: { field: string; filename: string; content: string }[] = []) {
  const { body, headers } = multipart(fields, files);
  const res = await app.inject({
    method: "POST",
    url: "/api/models",
    headers,
    payload: body,
    cookies: { printlib_session: sessionCookie },
  });
  return res.json().id as number;
}

describe("GET /api/models/:id/download", () => {
  it("streams a zip containing every file, publicly (no auth needed)", async () => {
    const modelId = await createModel({ name: "Zip test model" }, [
      { field: "file", filename: "a.stl", content: "AAA" },
      { field: "file", filename: "b.stl", content: "BBB" },
    ]);

    const res = await app.inject({ method: "GET", url: `/api/models/${modelId}/download` });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/zip");

    const zip = new AdmZip(res.rawPayload);
    const entries = zip.getEntries().map((e) => e.entryName).sort();
    expect(entries).toEqual(["a.stl", "b.stl"]);
  });

  it("404s for a model with no files", async () => {
    const modelId = await createModel({ name: "Source only", sourceUrl: "https://www.printables.com/model/9" });
    const res = await app.inject({ method: "GET", url: `/api/models/${modelId}/download` });
    expect(res.statusCode).toBe(404);
  });

  it("404s for a nonexistent model", async () => {
    const res = await app.inject({ method: "GET", url: "/api/models/999999/download" });
    expect(res.statusCode).toBe(404);
  });
});
