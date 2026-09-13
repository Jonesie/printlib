import { describe, expect, it } from "vitest";
import { checkPassword, isValidSessionToken, makeSessionToken } from "./auth.js";

describe("checkPassword", () => {
  it("accepts the correct password", () => {
    expect(checkPassword("test-password")).toBe(true);
  });

  it("rejects an incorrect password", () => {
    expect(checkPassword("wrong")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(checkPassword("")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a freshly made token", () => {
    expect(isValidSessionToken(makeSessionToken())).toBe(true);
  });

  it("rejects undefined", () => {
    expect(isValidSessionToken(undefined)).toBe(false);
  });

  it("rejects garbage input", () => {
    expect(isValidSessionToken("not-a-token")).toBe(false);
  });

  it("rejects a token with its signature stripped", () => {
    const [payload] = makeSessionToken().split(".");
    expect(isValidSessionToken(payload)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = makeSessionToken();
    const [payload, signature] = token.split(".");
    const flipped = signature.slice(0, -1) + (signature.at(-1) === "a" ? "b" : "a");
    expect(isValidSessionToken(`${payload}.${flipped}`)).toBe(false);
  });
});
