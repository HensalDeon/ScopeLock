import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { organization } from "better-auth/plugins/organization";
import { db, mongoClient } from "@/shared/db/client";
import { codeEmail, sendEmail } from "@/shared/email";
import { env, isGoogleAuthEnabled } from "@/shared/lib/env";
import { CODE_LENGTH, CODE_MAX_ATTEMPTS, CODE_TTL_MINUTES } from "./codes";
import { findDefaultWorkspaceId } from "./membership";

const e = env();

/**
 * Better Auth — accounts, sessions and workspaces (Better Auth "organizations").
 * Mounted at /api/auth/* (see src/app/api/auth/[...all]/route.ts).
 */
export const auth = betterAuth({
  appName: "ScopeLock",
  baseURL: e.APP_URL,
  secret: e.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db(), { client: mongoClient() }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
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

  socialProviders: isGoogleAuthEnabled()
    ? {
        google: {
          clientId: e.GOOGLE_CLIENT_ID!,
          clientSecret: e.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  // Stored in MongoDB so limits hold across serverless instances.
  rateLimit: { storage: "database" },

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
      organizationLimit: 5,
    }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
