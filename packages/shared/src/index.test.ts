import { describe, expect, it } from "vitest";
import { classifyFileType, detectSourceSiteName } from "./index.js";

describe("classifyFileType", () => {
  it.each([
    ["part.stl", "stl"],
    ["PART.STL", "stl"],
    ["model.3mf", "3mf"],
    ["mesh.obj", "obj"],
    ["print.gcode", "gcode"],
    ["print.gco", "gcode"],
    ["part.step", "step"],
    ["part.stp", "step"],
    ["photo.png", "image"],
    ["photo.jpg", "image"],
    ["photo.jpeg", "image"],
    ["readme.txt", "other"],
    ["no-extension", "other"],
  ] as const)("classifies %s as %s", (filename, expected) => {
    expect(classifyFileType(filename)).toBe(expected);
  });
});

describe("detectSourceSiteName", () => {
  it.each([
    ["https://www.printables.com/model/123-thing", "Printables"],
    ["https://printables.com/model/123-thing", "Printables"],
    ["https://makerworld.com/en/models/456", "MakerWorld"],
    ["https://www.thingiverse.com/thing:789", "Thingiverse"],
    ["https://www.myminifactory.com/object/1", "MyMiniFactory"],
    ["https://cults3d.com/en/3d-model/1", "Cults3D"],
    ["https://gridfinity.xyz/some/path", "Gridfinity"],
  ] as const)("recognizes %s as %s", (url, expected) => {
    expect(detectSourceSiteName(url)).toBe(expected);
  });

  it("returns null for an unrecognized site", () => {
    expect(detectSourceSiteName("https://example.com/model/1")).toBeNull();
  });

  it("returns null for an invalid URL", () => {
    expect(detectSourceSiteName("not a url")).toBeNull();
  });
});
