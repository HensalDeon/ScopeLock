import { describe, expect, it } from "vitest";
import { initialsOf } from "./business-initials";

describe("initialsOf", () => {
  it.each([
    ["Pixel & Code Studio", "PC"],
    ["Pixel and Code", "PC"],
    ["The Design Co", "DC"],
    ["Hensal Deon", "HD"],
    ["Mehta", "ME"],
    ["  ", "–"],
    ["and", "AN"],
  ])("%s → %s", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
