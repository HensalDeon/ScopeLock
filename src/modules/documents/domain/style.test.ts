import { describe, expect, it } from "vitest";
import { contrast, mix, readableShade, textOn } from "./color";
import {
  accentNeedsDarkening,
  ACCENT_PRESETS,
  COVER_STYLES,
  documentPalette,
  documentStyleSchema,
} from "./style";

describe("colour maths", () => {
  it("knows black on white is the maximum contrast", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrast("#777777", "#777777")).toBeCloseTo(1, 5);
  });

  it("mixes colours", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("darkens a pale accent until it's readable on white", () => {
    const shade = readableShade("#f5d90a", "#ffffff");
    expect(contrast(shade, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(readableShade("#1e3a8a", "#ffffff")).toBe("#1e3a8a");
  });

  it("picks dark or white text for a background", () => {
    expect(textOn("#f5d90a")).toBe("#111318");
    expect(textOn("#1e3a8a")).toBe("#ffffff");
  });
});

describe("documentPalette", () => {
  it.each(
    ACCENT_PRESETS.flatMap((p) =>
      COVER_STYLES.map((c) => [p.label, p.hex, c] as const),
    ),
  )("%s on a %s cover keeps text readable", (_label, accent, cover) => {
    const p = documentPalette({ accent, cover });
    expect(contrast(p.accentText, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.coverText, p.coverBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.coverLabel, p.coverBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(3);
  });

  it("stays readable even with a very pale custom accent", () => {
    const p = documentPalette({ accent: "#fff4c2", cover: "light" });
    expect(contrast(p.accentText, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.coverLabel, p.coverBg)).toBeGreaterThanOrEqual(4.5);
    expect(accentNeedsDarkening("#fff4c2")).toBe(true);
  });
});

describe("documentStyleSchema", () => {
  it("parses form values", () => {
    expect(
      documentStyleSchema.parse({
        template: "classic",
        accent: " #B08D57 ",
        cover: "accent",
        coverPattern: "false",
        headingFont: "sans",
        showLogo: "true",
      }),
    ).toEqual({
      template: "classic",
      accent: "#b08d57",
      cover: "accent",
      coverPattern: false,
      headingFont: "sans",
      showLogo: true,
    });
  });

  it("rejects a bad colour", () => {
    const result = documentStyleSchema.safeParse({
      template: "classic",
      accent: "gold",
      cover: "dark",
      coverPattern: "true",
      headingFont: "serif",
      showLogo: "true",
    });
    expect(result.error?.issues[0]?.message).toBe("Use a colour like #b08d57.");
  });
});
