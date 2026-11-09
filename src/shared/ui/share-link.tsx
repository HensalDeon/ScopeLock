"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { whatsappLink } from "@/shared/lib/phone";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

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
}: {
  url: string;
  phone: string | null;
  message: string;
  /** False when sending the link isn't the page's main action. */
  primary?: boolean;
}) {
  const uid = useId();
  const [copied, setCopied] = useState(false);
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
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              document.getElementById(`${uid}-link`)?.focus();
            }
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button asChild variant={primary ? "default" : "outline"}>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            WhatsApp
          </a>
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </p>
    </div>
  );
}
