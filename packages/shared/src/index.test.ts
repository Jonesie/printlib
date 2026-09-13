import { describe, expect, it } from "vitest";
import { classifyFileType } from "./index.js";

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
