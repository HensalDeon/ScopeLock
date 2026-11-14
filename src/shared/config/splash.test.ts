import { describe, expect, it } from "vitest";
import { isSplashSize, splashStartupImages } from "./splash";

describe("iPhone start-up screens", () => {
  it("has one image per screen, sized in device pixels", () => {
    const images = splashStartupImages();
    expect(images).toContainEqual({
      url: "/splash?w=1170&h=2532",
      media:
        "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    });
    expect(new Set(images.map((i) => i.url)).size).toBe(images.length);
  });

  it("draws only those sizes", () => {
    expect(isSplashSize(1170, 2532)).toBe(true);
    expect(isSplashSize(828, 1792)).toBe(true);
    expect(isSplashSize(5000, 5000)).toBe(false);
  });
});
