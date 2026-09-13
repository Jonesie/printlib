import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

const app = buildApp();

describe("public reads", () => {
  it("GET /api/models is public and returns an array", async () => {
    const res = await app.inject({ method: "GET", url: "/api/models" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it("GET /api/categories is public", async () => {
    const res = await app.inject({ method: "GET", url: "/api/categories" });
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/session reports unauthenticated with no cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/session" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ authenticated: false });
  });
});

describe("write gating", () => {
  it("rejects an unauthenticated write with 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/categories",
      payload: { name: "Should not be created" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects login with the wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { password: "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("logging out without a session is a harmless no-op", async () => {
    const res = await app.inject({ method: "POST", url: "/api/logout" });
    expect(res.statusCode).toBe(200);
  });
});

describe("authenticated session", () => {
  it("logs in with the correct password and can then write", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { password: "test-password" },
    });
    expect(loginRes.statusCode).toBe(200);

    const cookie = loginRes.cookies.find((c) => c.name === "printlib_session");
    expect(cookie).toBeTruthy();

    const sessionRes = await app.inject({
      method: "GET",
      url: "/api/session",
      cookies: { printlib_session: cookie!.value },
    });
    expect(sessionRes.json()).toEqual({ authenticated: true });

    const createRes = await app.inject({
      method: "POST",
      url: "/api/categories",
      payload: { name: "Test Category" },
      cookies: { printlib_session: cookie!.value },
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().name).toBe("Test Category");
  });
});
