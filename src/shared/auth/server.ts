import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { organization } from "better-auth/plugins/organization";
import { db, mongoClient } from "@/shared/db/client";
import { codeEmail, sendEmail } from "@/shared/email";
import { env } from "@/shared/lib/env";
import { findDefaultWorkspaceId } from "./membership";
import {
  CODE_LENGTH,
  CODE_MAX_ATTEMPTS,
  CODE_TTL_MINUTES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./policy";

const e = env();

/**
 * Better Auth endpoints we don't use. They stay callable from server code
 * (`auth.api.*` skips this list) but answer 404 over HTTP, so a stolen
 * session can't delete a workspace, invite strangers or create extra
 * workspaces past onboarding and plan limits.
 */
const DISABLED_HTTP_PATHS = [
  // Passwordless sign-in: we use email + password, codes only for verify/reset.
  "/sign-in/email-otp",
  // Old link-based reset/verify flow; codes replace it.
  "/request-password-reset",
  "/reset-password",
  "/verify-email",
  // Workspaces are created and renamed only by our server actions.
  "/organization/create",
  "/organization/update",
  "/organization/delete",
  "/organization/check-slug",
  // Teams arrive with the Agency plan; until then, no invitations.
  "/organization/invite-member",
  "/organization/accept-invitation",
  "/organization/reject-invitation",
  "/organization/cancel-invitation",
  "/organization/remove-member",
  "/organization/update-member-role",
  "/organization/leave",
];

/**
 * Better Auth: accounts, sessions and workspaces (Better Auth "organizations").
 * Mounted at /api/auth/* (see src/app/api/auth/[...all]/route.ts).
 */
export const auth = betterAuth({
  appName: "ScopeLock",
  baseURL: e.APP_URL,
  secret: e.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db(), { client: mongoClient() }),
  disabledPaths: DISABLED_HTTP_PATHS,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    autoSignIn: true,
    // Password resets use emailed codes (emailOTP below), not links.
    revokeSessionsOnPasswordReset: true,
  },

  // Verification is soft: people can use the app straight away and confirm
  // with the code from the sign-up email. The emailOTP plugin supplies the
  // sender, so no sendVerificationEmail here (ours would override it).
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
  },

  socialProviders:
    e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: e.GOOGLE_CLIENT_ID,
            clientSecret: e.GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        }
      : {},

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
    // Reads may trust a signed cookie for up to 5 minutes. Writes re-check the
    // database (see getFreshSession), so a revoked session can't change data.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  // Stored in MongoDB so limits hold across serverless instances.
  rateLimit: { storage: "database" },

  advanced: {
    // Which header carries the visitor's real IP. Rate limits are per IP, so
    // this must be a header the host sets and clients can't forge:
    // Vercel → x-forwarded-for (overwritten by Vercel); nginx → x-real-ip.
    ipAddress: { ipAddressHeaders: [e.CLIENT_IP_HEADER] },
  },

  databaseHooks: {
    session: {
      create: {
        // Open every new session in the user's workspace.
        before: async (session) => {
          const workspaceId = await findDefaultWorkspaceId(session.userId);
          return {
            data: { ...session, activeOrganizationId: workspaceId },
          };
        },
      },
    },
  },

  plugins: [
    emailOTP({
      otpLength: CODE_LENGTH,
      expiresIn: CODE_TTL_MINUTES * 60,
      allowedAttempts: CODE_MAX_ATTEMPTS,
      storeOTP: "hashed",
      // Codes are only for existing accounts; never mail a stranger's inbox.
      disableSignUp: true,
      overrideDefaultEmailVerification: true,
      // Per IP, per route. Each code also dies after CODE_MAX_ATTEMPTS wrong
      // guesses. Kept above the default of 3 because Indian mobile carriers
      // put many people behind one shared IP (CGNAT).
      rateLimit: { window: 60, max: 6 },
      sendVerificationOTP: async ({ email, otp, type }) => {
        const { subject, content } = codeEmail(type, otp);
        await sendEmail({ to: email, subject, content });
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      // One workspace per account until teams/agency plans exist. Also stops a
      // double-submitted onboarding form from creating two workspaces.
      organizationLimit: 1,
      disableOrganizationDeletion: true,
    }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
