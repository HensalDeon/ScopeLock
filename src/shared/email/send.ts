import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env, isSmtpConfigured } from "@/shared/lib/env";
import { renderEmail, type EmailContent } from "./layout";

let transporter: Transporter | undefined;

function smtp(): Transporter {
  const e = env();
  transporter ??= nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_PORT === 465,
    auth: { user: e.SMTP_USER, pass: e.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  content,
}: {
  to: string;
  subject: string;
  content: EmailContent;
}): Promise<void> {
  const e = env();
  const { html, text } = renderEmail(content, e.APP_URL);

  if (!isSmtpConfigured()) {
    // No SMTP yet: print the email so links can be clicked from the terminal.
    const level = e.NODE_ENV === "production" ? "error" : "info";
    console[level](
      [
        "",
        "┌─ Email (SMTP not configured — not sent) ─────────────",
        `│ To:      ${to}`,
        `│ Subject: ${subject}`,
        "│",
        ...text.split("\n").map((line) => `│ ${line}`),
        "└──────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  await smtp().sendMail({ from: e.EMAIL_FROM, to, subject, html, text });
}
