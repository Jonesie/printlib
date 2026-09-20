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

async function createModel() {
  const { body, headers } = multipart({ name: "Material test model" }, [
    { field: "file", filename: "a.stl", content: "AAA" },
  ]);
  const res = await app.inject({
    method: "POST",
    url: "/api/models",
    headers,
    payload: body,
    cookies: { printlib_session: sessionCookie },
  });
  return res.json().id as number;
}

async function logPrint(modelId: number, material: string) {
  const { body, headers } = multipart({
    success: "true",
    date: "2026-01-01T00:00:00.000Z",
    material,
  });
  return app.inject({
    method: "POST",
    url: `/api/models/${modelId}/print-logs`,
    headers,
    payload: body,
    cookies: { printlib_session: sessionCookie },
  });
}

describe("GET /api/materials", () => {
  it("is public and returns an array", async () => {
    const res = await app.inject({ method: "GET", url: "/api/materials" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it("returns distinct materials already logged, sorted", async () => {
    const modelId = await createModel();
    await logPrint(modelId, "PETG");
    await logPrint(modelId, "PLA");
    await logPrint(modelId, "PLA");

    const res = await app.inject({ method: "GET", url: "/api/materials" });
    const materials = res.json() as string[];
    expect(materials).toContain("PLA");
    expect(materials).toContain("PETG");
    expect(materials.filter((m) => m === "PLA")).toHaveLength(1);
  });

  it("always includes the standard filament types, even unlogged ones", async () => {
    const res = await app.inject({ method: "GET", url: "/api/materials" });
    const materials = res.json() as string[];
    expect(materials).toContain("ABS");
    expect(materials).toContain("TPU");
    expect(materials).toContain("Nylon");
  });

  it("includes a custom logged material alongside the standard ones", async () => {
    const modelId = await createModel();
    await logPrint(modelId, "Wood Fill");
    await logPrint(modelId, "Glow-in-the-dark PLA");

    const res = await app.inject({ method: "GET", url: "/api/materials" });
    const materials = res.json() as string[];
    expect(materials).toContain("PLA");
    expect(materials).toContain("Glow-in-the-dark PLA");
    expect(materials.filter((m) => m === "Wood Fill")).toHaveLength(1);
  });
});
