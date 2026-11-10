"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/shared/lib/utils";
import { TOUCH } from "@/shared/ui/touch";

/** Chrome / Edge / Android's install prompt event. */
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const DISMISSED = "sl-install-dismissed";

/** What this browser can do: nothing (installed, dismissed), its own prompt, or iPhone steps. */
function installKind(): "none" | "ios" {
  try {
    if (localStorage.getItem(DISMISSED) === "1") return "none";
  } catch {
    // Storage blocked: just offer it.
  }
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "none";
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
    ? "ios"
    : "none";
}

const noop = () => () => {};

/**
 * "Install ScopeLock" in the sidebar: the browser's own install prompt where
 * there is one (Chrome, Edge, Android), the two steps on iPhone Safari.
 * Hidden once installed or dismissed.
 */
export function InstallApp({ className }: { className?: string }) {
  const kind = useSyncExternalStore(noop, installKind, () => "none" as const);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setDismissed(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Hidden for this visit only.
    }
  };

  if (dismissed || (kind !== "ios" && !prompt)) return null;
  return (
    <div
      className={cn(
        "grid gap-1 rounded-lg border bg-background p-1.5",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            prompt
              ? void prompt.prompt().then(() => setPrompt(null))
              : setSteps((s) => !s)
          }
          aria-expanded={kind === "ios" ? steps : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent",
            TOUCH,
          )}
        >
          <Download
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          Install ScopeLock
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Don't show install again"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            TOUCH,
          )}
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      {kind === "ios" && steps && (
        <p className="px-1.5 pb-1 text-[13px] leading-relaxed text-pretty text-muted-foreground">
          In Safari, tap{" "}
          <Share aria-label="Share" className="inline size-3.5 align-[-2px]" />{" "}
          Share, then{" "}
          <span className="font-medium text-foreground">
            Add to Home Screen
          </span>
          . It opens like an app, without the browser bar.
        </p>
      )}
    </div>
  );
}
