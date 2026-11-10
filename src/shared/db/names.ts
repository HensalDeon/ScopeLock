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
  approvals: "approvals",
  changeRequests: "changeRequests",
  activity: "activity",
  paymentSettings: "paymentSettings",
  payments: "payments",
  invoicingSettings: "invoicingSettings",
  invoices: "invoices",
  requestLimits: "requestLimits",
  counters: "counters",
  // Platform level: plans, their price history, the admin audit log, and
  // each workspace's ScopeLock plan (ScopeLock's own billing record about a
  // workspace, managed by the platform, one per workspace).
  plans: "plans",
  subscriptions: "subscriptions",
  planPrices: "planPrices",
  adminAudit: "adminAudit",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
