import {
  brandColors,
  MARK_STROKE,
  MARK_VIEWBOX,
  markCore,
  markPaths,
} from "@/shared/ui/brand/geometry";

/**
 * The page the service worker shows when a page can't load offline. One
 * self-contained document (no app CSS, scripts or fonts, which aren't
 * available offline), with the mark drawn from the shared geometry.
 * It reloads itself when the connection comes back.
 */
export function offlineHtml(): string {
  const mark = `<svg viewBox="${MARK_VIEWBOX}" width="28" height="28" aria-hidden="true" fill="none"><path d="${markPaths.bracketTopLeft}" stroke="${brandColors.ink}" stroke-width="${MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round"/><path d="${markPaths.bracketBottomRight}" stroke="${brandColors.ink}" stroke-width="${MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round"/><rect x="${markCore.x}" y="${markCore.y}" width="${markCore.width}" height="${markCore.height}" rx="${markCore.rx}" fill="${brandColors.brand}"/></svg>`;
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${brandColors.ink}">
<title>You're offline · ScopeLock</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; }
  body { min-height: 100dvh; display: grid; place-items: center; padding: 24px; background: #f7f8fa; color: ${brandColors.ink}; font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width: 100%; max-width: 26rem; background: #fff; border: 1px solid #e3e6eb; border-radius: 11px; padding: 28px 24px; }
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 17px; letter-spacing: -0.01em; }
  .dot { width: 8px; height: 8px; border-radius: 99px; background: #b45309; flex: none; }
  h1 { margin-top: 28px; display: flex; align-items: center; gap: 10px; font-size: 22px; line-height: 1.25; letter-spacing: -0.02em; }
  p { margin-top: 10px; color: #5a6475; }
  button { margin-top: 22px; width: 100%; min-height: 44px; border: 0; border-radius: 8px; background: ${brandColors.ink}; color: #fff; font: inherit; font-weight: 500; cursor: pointer; }
  button:focus-visible { outline: 3px solid rgba(14,159,110,0.5); outline-offset: 2px; }
</style>
</head>
<body>
<main>
  <div class="brand">${mark}<span>scopelock</span></div>
  <h1><span class="dot" aria-hidden="true"></span>You're offline</h1>
  <p>ScopeLock needs a connection to show your projects, approvals and payments. Nothing about your clients is stored on this device.</p>
  <p>This page reloads by itself when you're back online.</p>
  <button type="button" onclick="location.reload()">Try again</button>
</main>
<script>addEventListener("online", function () { location.reload(); });</script>
</body>
</html>`;
}
