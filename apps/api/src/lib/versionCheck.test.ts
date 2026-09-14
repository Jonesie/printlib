import { describe, expect, it } from "vitest";
import { isNewer } from "./versionCheck.js";

describe("isNewer", () => {
  it("detects a newer patch version", () => {
    expect(isNewer("1.0.1", "1.0.0")).toBe(true);
    expect(isNewer("1.0.0", "1.0.0")).toBe(false);
  });

  it("detects a newer minor/major version", () => {
    expect(isNewer("1.1.0", "1.0.9")).toBe(true);
    expect(isNewer("2.0.0", "1.9.9")).toBe(true);
  });

  it("compares numerically, not lexicographically", () => {
    expect(isNewer("1.10.0", "1.2.0")).toBe(true);
  });

  it("is false when current is already ahead", () => {
    expect(isNewer("1.0.0", "1.1.0")).toBe(false);
  });

  it("ignores a leading v on either side", () => {
    expect(isNewer("v1.2.0", "v1.1.0")).toBe(true);
  });

  it("treats a missing segment as 0", () => {
    expect(isNewer("1.1", "1.0.5")).toBe(true);
  });
});
