import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { db, mongoClient } from "@/shared/db/client";
import {
  resetPasswordTemplate,
  sendEmail,
  verifyEmailTemplate,
} from "@/shared/email";
import { env, isGoogleAuthEnabled } from "@/shared/lib/env";
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
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your ScopeLock password",
        content: resetPasswordTemplate(user.name, url),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Confirm your email for ScopeLock",
        content: verifyEmailTemplate(user.name, url),
      });
    },
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
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
    }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
