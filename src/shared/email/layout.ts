import { brandColors } from "@/shared/ui/brand/geometry";

/** Matches the inline image attached by send.ts (see mark.tsx). */
export const MARK_CID = "scopelock-mark";

export type EmailContent = {
  /** Shown in the inbox list after the subject. */
  preview: string;
  heading: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  /** A one-time code, shown large and easy to copy. */
  code?: string;
  /** Small print under the button, e.g. expiry or "didn't ask for this?". */
  footnote?: string;
};

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * One plain, table-based layout for every transactional email.
 * Inline styles only (email clients ignore <style> blocks), no images
 * besides the small mark, so it renders the same in Gmail, Outlook and Apple Mail.
 */
/** Only web links go in emails; blocks javascript:, data: and friends. */
function safeHref(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Refusing to put a ${parsed.protocol} link in an email`);
  }
  return parsed.toString();
}

export function renderEmail(content: EmailContent, appUrl: string) {
  const { ink } = brandColors;
  const muted = "#5a6475";
  const line = "#e2e5ea";

  const paragraphs = content.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${ink};">${escape(p)}</p>`,
    )
    .join("");

  const actionUrl = content.action ? safeHref(content.action.url) : "";
  const action = content.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="background:${ink};border-radius:8px;">
         <a href="${escape(actionUrl)}" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escape(content.action.label)}</a>
       </td></tr></table>
       <p style="margin:0 0 24px;font-size:13px;line-height:20px;color:${muted};">Button not working? Paste this link into your browser:<br><span style="color:${ink};word-break:break-all;">${escape(actionUrl)}</span></p>`
    : "";

  const code = content.code
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="background:#f5f6f8;border:1px solid ${line};border-radius:8px;padding:14px 22px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:30px;line-height:36px;font-weight:600;letter-spacing:8px;color:${ink};">${escape(content.code)}</td></tr></table>`
    : "";

  const footnote = content.footnote
    ? `<p style="margin:0;font-size:13px;line-height:20px;color:${muted};">${escape(content.footnote)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(content.heading)}</title></head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(content.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${line};border-radius:12px;">
      <tr><td style="padding:28px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:8px;vertical-align:middle;">
            <img src="cid:${MARK_CID}" width="22" height="22" alt="" style="display:block;width:22px;height:22px;border:0;outline:none;">
          </td>
          <td style="vertical-align:middle;font-size:16px;font-weight:600;letter-spacing:-0.3px;color:${ink};">scopelock</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px 32px 32px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:28px;font-weight:600;color:${ink};">${escape(content.heading)}</h1>
        ${paragraphs}
        ${code}
        ${action}
        ${footnote}
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:${muted};">ScopeLock · <a href="${escape(appUrl)}" style="color:${muted};">${escape(appUrl.replace(/^https?:\/\//, ""))}</a></p>
  </td></tr>
</table>
</body></html>`;

  const text = [
    content.heading,
    "",
    ...content.paragraphs.flatMap((p) => [p, ""]),
    ...(content.code ? [`Your code: ${content.code}`, ""] : []),
    ...(content.action
      ? [`${content.action.label}: ${content.action.url}`, ""]
      : []),
    ...(content.footnote ? [content.footnote, ""] : []),
    "— ScopeLock",
  ].join("\n");

  return { html, text };
}
