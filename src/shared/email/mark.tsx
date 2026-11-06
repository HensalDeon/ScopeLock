import "server-only";
import { ImageResponse } from "next/og";
import { OgMarkOnLight } from "@/shared/ui/brand/og-mark";

/** Shown at 22px; drawn at 4× so it's sharp on phones. */
const SIZE = 88;
let rendered: Promise<Buffer | null> | undefined;

/**
 * The ScopeLock mark as a PNG, attached to every email as an inline image.
 * Gmail and Outlook drop inline SVG, and an attached image needs no outside
 * URL (so it also shows when remote images are blocked). Drawn from the
 * brand geometry once per server process. Null if rendering fails: the
 * email still goes, with the wordmark only.
 */
export function emailMarkPng(): Promise<Buffer | null> {
  rendered ??= new ImageResponse(<OgMarkOnLight size={SIZE} />, {
    width: SIZE,
    height: SIZE,
  })
    .arrayBuffer()
    .then((bytes) => Buffer.from(bytes))
    .catch((error: unknown) => {
      console.error("[email] logo not rendered", error);
      rendered = undefined;
      return null;
    });
  return rendered;
}
