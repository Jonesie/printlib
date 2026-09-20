import { beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

const app = buildApp();
let sessionCookie: string;

beforeAll(async () => {
  const res = await app.inject({ method: "POST", url: "/api/login", payload: { password: "test-password" } });
  sessionCookie = res.cookies.find((c) => c.name === "printlib_session")!.value;
});

function multipart(fields: Record<string, string>) {
  const boundary = "----printlib-test-boundary";
  const body = Object.entries(fields)
    .map(([key, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`)
    .join("") + `--${boundary}--\r\n`;
  return { body, headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

describe("POST /api/models", () => {
  it("rejects a model with neither files nor a source URL", async () => {
    const { body, headers } = multipart({ name: "Nothing at all" });
    const res = await app.inject({
      method: "POST",
      url: "/api/models",
      headers,
      payload: body,
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it("accepts a source-only model and auto-detects a known site", async () => {
    const { body, headers } = multipart({
      name: "Printables mirror",
      sourceUrl: "https://www.printables.com/model/1-thing",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/models",
      headers,
      payload: body,
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().sourceSiteName).toBe("Printables");
    expect(res.json().files).toEqual([]);
  });

  it("rejects an unrecognized source URL with no site name given", async () => {
    const { body, headers } = multipart({ name: "Mystery site", sourceUrl: "https://example.com/model/1" });
    const res = await app.inject({
      method: "POST",
      url: "/api/models",
      headers,
      payload: body,
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it("accepts an unrecognized source URL when a site name is given", async () => {
    const { body, headers } = multipart({
      name: "Custom site model",
      sourceUrl: "https://example.com/model/1",
      sourceSiteName: "Example Models",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/models",
      headers,
      payload: body,
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().sourceSiteName).toBe("Example Models");
  });
});

describe("PATCH /api/models/:id", () => {
  async function createSourceOnlyModel() {
    const { body, headers } = multipart({
      name: "Patchable model",
      sourceUrl: "https://www.printables.com/model/2-thing",
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/models",
      headers,
      payload: body,
      cookies: { printlib_session: sessionCookie },
    });
    return res.json().id as number;
  }

  it("refuses to clear the source URL on a model with no files", async () => {
    const id = await createSourceOnlyModel();
    const res = await app.inject({
      method: "PATCH",
      url: `/api/models/${id}`,
      payload: { sourceUrl: null },
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it("re-detects the site name when the source URL changes", async () => {
    const id = await createSourceOnlyModel();
    const res = await app.inject({
      method: "PATCH",
      url: `/api/models/${id}`,
      payload: { sourceUrl: "https://www.thingiverse.com/thing:1" },
      cookies: { printlib_session: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().sourceSiteName).toBe("Thingiverse");
  });
});

describe("GET /api/models?printerName=", () => {
  async function createModel(name: string) {
    const { body, headers } = multipart({ name, sourceUrl: "https://www.printables.com/model/3-thing" });
    const res = await app.inject({
      method: "POST",
      url: "/api/models",
      headers,
      payload: body,
      cookies: { printlib_session: sessionCookie },
    });
    return res.json().id as number;
  }

  async function logPrint(modelId: number, printerName: string) {
    const { body, headers } = multipart({ success: "true", date: "2026-01-01T00:00:00.000Z", printerName });
    await app.inject({
      method: "POST",
      url: `/api/models/${modelId}/print-logs`,
      headers,
      payload: body,
      cookies: { printlib_session: sessionCookie },
    });
  }

  it("only returns models printed on the given printer", async () => {
    const printedOnA = await createModel("Printed on A");
    const printedOnB = await createModel("Printed on B");
    await logPrint(printedOnA, "Printer A");
    await logPrint(printedOnB, "Printer B");

    const res = await app.inject({ method: "GET", url: "/api/models?printerName=Printer%20A" });
    const ids = (res.json() as { id: number }[]).map((m) => m.id);
    expect(ids).toContain(printedOnA);
    expect(ids).not.toContain(printedOnB);
  });
});
