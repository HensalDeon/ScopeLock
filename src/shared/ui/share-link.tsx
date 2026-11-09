"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { whatsappLink } from "@/shared/lib/phone";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { TOUCH } from "@/shared/ui/touch";

/**
 * A client link with Copy and WhatsApp buttons. `message` is the text that
 * goes before the link in WhatsApp; with no phone number, WhatsApp asks who
 * to send it to.
 */
export function ShareLink({
  url,
  phone,
  message,
  primary = true,
  compact = false,
  copyLabel = "Copy link",
  whatsappLabel = "Send on WhatsApp",
}: {
  url: string;
  phone: string | null;
  message: string;
  /** False when sending the link isn't the page's main action. */
  primary?: boolean;
  /** Buttons only; the link text shows only if copying fails. */
  compact?: boolean;
  copyLabel?: string;
  /** Says what happens, e.g. "Send Rahul the pay link on WhatsApp". */
  whatsappLabel?: string;
}) {
  const uid = useId();
  const [copied, setCopied] = useState(false);
  const [showField, setShowField] = useState(!compact);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const text = `${message} ${url}`;
  const whatsapp = phone
    ? whatsappLink(phone, text)
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className="grid gap-2">
      {showField && (
        <>
          <label htmlFor={`${uid}-link`} className="sr-only">
            Client link
          </label>
          <Input
            id={`${uid}-link`}
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono text-xs"
          />
        </>
      )}
      <div
        className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-2 gap-2"}
      >
        <Button
          type="button"
          variant="outline"
          className={TOUCH}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              // No clipboard (old browser, permissions): show the link to copy.
              setShowField(true);
              requestAnimationFrame(() =>
                document.getElementById(`${uid}-link`)?.focus(),
              );
            }
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : copyLabel}
        </Button>
        <Button
          asChild
          variant={primary ? "default" : "outline"}
          className={TOUCH}
        >
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {whatsappLabel}
          </a>
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </p>
    </div>
  );
}
