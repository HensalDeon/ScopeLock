import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { emailTransport, env, isSmtpConfigured } from "@/shared/lib/env";
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

  const transport = emailTransport();

  if (transport === "none") {
    // Production without SMTP. Never print the body: it can hold sign-in
    // codes, and logs are readable by more people than an inbox.
    console.error(
      `[email] SMTP is not configured; "${content.heading}" was not sent.`,
    );
    return;
  }

  if (transport === "console") {
    // Development (or a local production build): print the email so codes
    // and links work from the terminal.
    console.info(
      [
        "",
        "┌─ Email (printed, not sent) ──────────────────────────",
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

  if (!isSmtpConfigured()) {
    throw new Error("EMAIL_TRANSPORT=smtp but SMTP_HOST/USER/PASS are missing");
  }
  await smtp().sendMail({ from: e.EMAIL_FROM, to, subject, html, text });
}
