import { describe, expect, it } from "vitest";
import { detectImageType, extensionFor } from "./image-type";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

describe("detectImageType", () => {
  it("recognises PNG, JPEG and WebP by their bytes", () => {
    expect(
      detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)),
    ).toBe("image/png");
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(
      detectImageType(
        bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBPVP8 ")),
      ),
    ).toBe("image/webp");
  });

  it.each([
    [
      "SVG (can carry scripts)",
      ascii('<svg xmlns="http://www.w3.org/2000/svg">'),
    ],
    ["HTML renamed to .png", ascii("<!doctype html><script>")],
    ["GIF", ascii("GIF89a")],
    [
      "RIFF that isn't WebP (WAV)",
      [...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE")],
    ],
    ["empty", []],
  ])("rejects %s", (_label, content) => {
    expect(detectImageType(bytes(...content))).toBeNull();
  });

  it("maps types to file extensions", () => {
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("image/webp")).toBe("webp");
  });
});
