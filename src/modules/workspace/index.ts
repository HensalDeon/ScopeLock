/**
 * Workspace module: public, client-safe API.
 * Server-only code (context, action wrapper) is in ./server.ts.
 */
export {
  BUSINESS_TYPE_LABELS,
  formatPhone,
  type BusinessType,
  type WorkspaceProfile,
} from "./domain/workspace";
export { BusinessDetailsForm } from "./ui/business-details-form";
export { BusinessInitials } from "./ui/business-initials";
export { OnboardingForm } from "./ui/onboarding-form";
