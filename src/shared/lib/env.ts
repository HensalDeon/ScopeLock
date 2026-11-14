import "server-only";
import { z } from "zod";

/**
 * Server-side environment variables, validated with Zod.
 *
 * Parsed lazily on first use (not at import time) so that `next build`
 * can prerender static pages even when runtime secrets are absent.
 */
const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: z.url().default("http://localhost:3000"),
    /**
     * Header holding the visitor's real IP, used for rate limits and approval
     * records. Must be set by your host, never trusted from the client.
     * Vercel: x-forwarded-for. Behind nginx: x-real-ip.
     */
    CLIENT_IP_HEADER: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .default("x-forwarded-for"),

    // Database
    MONGODB_URI: z
      .string()
      .min(1, "MONGODB_URI is required")
      .refine(
        (v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"),
        { message: "MONGODB_URI must start with mongodb:// or mongodb+srv://" },
      ),
    MONGODB_DB: z.string().min(1).default("scopelock"),

    // Auth
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,

    // Email (optional in development: emails are printed to the terminal instead)
    SMTP_HOST: optional,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: optional,
    SMTP_PASS: optional,
    EMAIL_FROM: z.string().default("ScopeLock <no-reply@scopelock.app>"),
    /**
     * Force a transport. Unset = SMTP when configured, else print to the
     * terminal in development and drop (without logging contents) in
     * production. "console" in production is only allowed on a localhost
     * APP_URL, for testing a production build locally.
     */
    EMAIL_TRANSPORT: optional.pipe(z.enum(["smtp", "console"]).optional()),

    // File storage: Cloudflare R2 (private bucket). Optional; uploads are
    // switched off until all four are set.
    R2_ACCOUNT_ID: optional,
    R2_ACCESS_KEY_ID: optional,
    R2_SECRET_ACCESS_KEY: optional,
    R2_BUCKET: optional,

    // Platform admins: comma-separated emails that may open /admin (plans
    // and prices). Their email must be confirmed. Unset = nobody.
    ADMIN_EMAILS: optional,

    // Razorpay: ScopeLock's own subscriptions (Pro, Agency). Optional;
    // paid plans can't be bought until all three are set. Test keys
    // (rzp_test_…) in development.
    RAZORPAY_KEY_ID: optional,
    RAZORPAY_KEY_SECRET: optional,
    RAZORPAY_WEBHOOK_SECRET: optional,

    // Scheduled jobs (automatic payment reminders): the secret a scheduler
    // sends as "Authorization: Bearer <CRON_SECRET>" to /api/cron/*.
    // Unset = the jobs can't be started.
    CRON_SECRET: z
      .string()
      .trim()
      .transform((v) => (v === "" ? undefined : v))
      .pipe(
        z
          .string()
          .min(32, "CRON_SECRET must be at least 32 characters.")
          .optional(),
      )
      .optional(),
  })
  .superRefine((e, ctx) => {
    if (e.NODE_ENV !== "production") return;
    // In production the app must know its real public https address: it sets
    // Secure cookies, the trusted origin for CSRF checks, and email links.
    const url = new URL(e.APP_URL);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !local) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_URL"],
        message: "APP_URL must start with https:// in production",
      });
    }
    if (e.EMAIL_TRANSPORT === "console" && !local) {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_TRANSPORT"],
        message:
          "EMAIL_TRANSPORT=console would print sign-in codes to production logs",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

export function isGoogleAuthEnabled(): boolean {
  const e = env();
  return Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET);
}

/** Where emails go: SMTP, the terminal, or nowhere (production without SMTP). */
export function emailTransport(): "smtp" | "console" | "none" {
  const e = env();
  if (e.EMAIL_TRANSPORT) return e.EMAIL_TRANSPORT;
  if (isSmtpConfigured()) return "smtp";
  return e.NODE_ENV === "production" ? "none" : "console";
}

export function isStorageConfigured(): boolean {
  const e = env();
  return Boolean(
    e.R2_ACCOUNT_ID &&
    e.R2_ACCESS_KEY_ID &&
    e.R2_SECRET_ACCESS_KEY &&
    e.R2_BUCKET,
  );
}

/** Paid plans can be bought (Razorpay keys and webhook secret set). */
export function isBillingConfigured(): boolean {
  const e = env();
  return Boolean(
    e.RAZORPAY_KEY_ID && e.RAZORPAY_KEY_SECRET && e.RAZORPAY_WEBHOOK_SECRET,
  );
}

export function isSmtpConfigured(): boolean {
  const e = env();
  return Boolean(e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS);
}
