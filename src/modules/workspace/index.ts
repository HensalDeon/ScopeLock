/**
 * Workspace module: public, client-safe API.
 * Server-only code (context, action wrapper) is in ./server.ts.
 */
export {
  BUSINESS_TYPE_LABELS,
  type BusinessType,
  type WorkspaceProfile,
} from "./domain/workspace";
export { BusinessDetailsForm } from "./ui/business-details-form";
export { BusinessInitials } from "./ui/business-initials";
export { setSetupVisibility } from "./server/actions";
export { OnboardingForm } from "./ui/onboarding-form";
