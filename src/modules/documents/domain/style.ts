import { z } from "zod";
import { contrast, isHex, mix, readableShade, textOn, type Hex } from "./color";

export const DOCUMENT_TEMPLATES = ["classic"] as const;
export type DocumentTemplate = (typeof DOCUMENT_TEMPLATES)[number];

export const COVER_STYLES = ["dark", "accent", "light"] as const;
export type CoverStyle = (typeof COVER_STYLES)[number];

export const COVER_STYLE_LABELS: Record<
  CoverStyle,
  { title: string; detail: string }
> = {
  dark: { title: "Dark", detail: "Deep charcoal, accent details" },
  accent: { title: "Accent colour", detail: "Your colour fills the cover" },
  light: { title: "Light", detail: "Soft tint, dark text" },
};

export const HEADING_FONTS = ["serif", "sans"] as const;
export type HeadingFont = (typeof HEADING_FONTS)[number];

export const ACCENT_PRESETS: readonly {
  id: string;
  label: string;
  hex: Hex;
}[] = [
  { id: "gold", label: "Gold", hex: "#b08d57" },
  { id: "emerald", label: "Emerald", hex: "#0e9f6e" },
  { id: "indigo", label: "Indigo", hex: "#4f46e5" },
  { id: "teal", label: "Teal", hex: "#0f766e" },
  { id: "terracotta", label: "Terracotta", hex: "#c2410c" },
  { id: "plum", label: "Plum", hex: "#9d174d" },
  { id: "navy", label: "Navy", hex: "#1e3a8a" },
];

/** How every client-facing document looks (Settings → Documents). */
export type DocumentStyle = {
  template: DocumentTemplate;
  accent: Hex;
  cover: CoverStyle;
  /** Decorative rings on the cover, as in the Estimator proposal. */
  coverPattern: boolean;
  headingFont: HeadingFont;
  showLogo: boolean;
};

export const DEFAULT_DOCUMENT_STYLE: DocumentStyle = {
  template: "classic",
  accent: "#b08d57",
  cover: "dark",
  coverPattern: true,
  headingFont: "serif",
  showLogo: true,
};

/** Fields of the document style form (all strings, as forms send them). */
export const DOCUMENT_STYLE_FIELDS = [
  "template",
  "accent",
  "cover",
  "coverPattern",
  "headingFont",
  "showLogo",
] as const;
export type DocumentStyleField = (typeof DOCUMENT_STYLE_FIELDS)[number];

const flag = z.enum(["true", "false"]).transform((v) => v === "true");

export const documentStyleSchema = z.object({
  template: z.enum(DOCUMENT_TEMPLATES),
  accent: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isHex, "Use a colour like #b08d57.")
    .transform((v) => v as Hex),
  cover: z.enum(COVER_STYLES, { error: "Choose a cover style." }),
  coverPattern: flag,
  headingFont: z.enum(HEADING_FONTS),
  showLogo: flag,
});

export function styleToFormValues(
  style: DocumentStyle,
): Record<DocumentStyleField, string> {
  return {
    template: style.template,
    accent: style.accent,
    cover: style.cover,
    coverPattern: String(style.coverPattern),
    headingFont: style.headingFont,
    showLogo: String(style.showLogo),
  };
}

const PAGE: Hex = "#ffffff";
const DARK_COVER: Hex = "#15161a";
const INK: Hex = "#111318";

/**
 * Every colour the template needs, derived from the accent so text always
 * stays readable (≥ 4.5:1 for body text, ≥ 3:1 for large/decorative).
 */
export function documentPalette(
  style: Pick<DocumentStyle, "accent" | "cover">,
) {
  const { accent } = style;
  const soft = mix(accent, PAGE, 0.9);
  const coverBg =
    style.cover === "dark"
      ? DARK_COVER
      : style.cover === "accent"
        ? accent
        : mix(accent, PAGE, 0.88);
  const coverText = style.cover === "light" ? INK : textOn(coverBg, INK);
  const coverLabel =
    style.cover === "accent" ? coverText : readableShade(accent, coverBg, 4.5);
  return {
    accent,
    /** Accent used for text and numbers on the white page. */
    accentText: readableShade(accent, PAGE, 4.5),
    /** Text placed on a solid accent background. */
    onAccent: textOn(accent, INK),
    soft,
    softText: readableShade(accent, soft, 4.5),
    coverBg,
    coverText,
    coverMuted: mix(coverText, coverBg, 0.3),
    coverLabel,
    coverRule: mix(coverText, coverBg, 0.78),
    ring:
      style.cover === "accent"
        ? mix(coverText, coverBg, 0.6)
        : mix(accent, coverBg, 0.35),
  };
}

export type DocumentPalette = ReturnType<typeof documentPalette>;

/** For the settings form: is the raw accent itself readable on white? */
export function accentNeedsDarkening(accent: Hex): boolean {
  return contrast(accent, PAGE) < 4.5;
}
