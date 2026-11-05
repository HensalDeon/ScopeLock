/**
 * Every collection name in one place. Better Auth owns the `auth*` ones
 * (singular names, its MongoDB adapter default); ScopeLock owns the rest.
 */
export const COLLECTIONS = {
  // Better Auth
  authUser: "user",
  authSession: "session",
  authAccount: "account",
  authVerification: "verification",
  authOrganization: "organization",
  authMember: "member",
  authInvitation: "invitation",
  authRateLimit: "rateLimit",

  // ScopeLock
  workspaceProfiles: "workspaceProfiles",
  clients: "clients",
  projects: "projects",
  documentSettings: "documentSettings",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
