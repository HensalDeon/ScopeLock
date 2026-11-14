/**
 * iPhone start-up screens for the installed app (iOS shows a blank white
 * screen without them). Each is drawn at /splash?w=…&h=… in device pixels,
 * and picked by the media query for that screen size.
 */
export const SPLASH_SCREENS = [
  // [points wide, points high, pixel ratio]
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 13, 14
  [375, 812, 3], // X, XS, 11 Pro, 12/13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [375, 667, 2], // SE, 8
] as const;

export function splashStartupImages() {
  return SPLASH_SCREENS.map(([w, h, ratio]) => ({
    url: `/splash?w=${w * ratio}&h=${h * ratio}`,
    media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
  }));
}

/** Only the sizes above are drawn. */
export function isSplashSize(w: number, h: number): boolean {
  return SPLASH_SCREENS.some(
    ([pw, ph, ratio]) => pw * ratio === w && ph * ratio === h,
  );
}
