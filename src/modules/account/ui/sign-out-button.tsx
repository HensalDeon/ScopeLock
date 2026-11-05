"use client";

import { Button } from "@/shared/ui/button";
import { useSignOut } from "./use-sign-out";

export function SignOutButton({
  variant = "ghost",
  size = "sm",
  className,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const { signOut, pending, failed } = useSignOut();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() => void signOut()}
    >
      {pending
        ? "Signing out…"
        : failed
          ? "Couldn't sign out. Try again"
          : "Sign out"}
    </Button>
  );
}
