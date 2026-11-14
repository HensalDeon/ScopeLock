"use client";

import Link from "next/link";
import { Switch } from "@/shared/ui/switch";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { ImageUpload } from "./image-upload";

/**
 * Logo: the upload, whether it (or your initials) shows on the cover, and
 * what clients see on this plan, with the way to plans when it's hidden.
 */
export function LogoControls({
  logoUrl,
  showLogo,
  onShowLogo,
  uploadsEnabled,
  branded,
  onUploaded,
}: {
  logoUrl: string | null;
  showLogo: boolean;
  onShowLogo: (on: boolean) => void;
  uploadsEnabled: boolean;
  /** The plan shows the logo to clients (Pro, Agency). */
  branded: boolean;
  onUploaded: (url: string | null) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-medium">Logo</legend>
      {uploadsEnabled && (
        <ImageUpload
          kind="logo"
          label="Your logo"
          hint="PNG, JPG or WebP, up to 5 MB. A transparent PNG looks best."
          url={logoUrl}
          enabled
          onChange={onUploaded}
          savedText={
            branded
              ? "Uploaded. Clients see it wherever your logo shows."
              : "Uploaded. Clients see your initials until you're on Pro or Agency."
          }
          removedText="Removed. Clients see your initials."
        />
      )}
      <label className="flex items-center justify-between gap-3 text-sm max-sm:min-h-11">
        {logoUrl && branded
          ? "Show your logo on the cover"
          : "Show your initials on the cover"}
        <Switch checked={showLogo} onCheckedChange={onShowLogo} />
      </label>
      {!branded && (
        <p className="text-sm text-pretty text-muted-foreground">
          Clients see your logo on Pro and Agency; on Free they see your
          initials.{" "}
          <Link
            href="/settings/plan"
            className={`font-medium text-foreground underline underline-offset-4 ${TOUCH_LINK}`}
          >
            See plans
          </Link>
        </p>
      )}
    </fieldset>
  );
}
