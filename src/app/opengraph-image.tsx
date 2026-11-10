import { ImageResponse } from "next/og";
import {
  brandColors,
  MARK_STROKE,
  MARK_VIEWBOX,
  markCore,
  markPaths,
} from "@/shared/ui/brand/geometry";

/** The preview card shown when a ScopeLock link is shared on WhatsApp, LinkedIn or X. */
export const alt =
  "ScopeLock: a project ledger showing ₹80,000 agreed, two approved change requests, and ₹95,000 project value";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const muted = "#8b95a7";
const line = "rgba(255,255,255,0.09)";

const rows = [
  { ref: "CR-001", title: "Blog section", amount: "+₹12,000" },
  { ref: "CR-002", title: "WhatsApp button", amount: "+₹3,000" },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: brandColors.ink,
        color: "#e8ecf2",
        padding: "64px 72px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 560,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width={44} height={44} viewBox={MARK_VIEWBOX}>
            <path
              d={markPaths.bracketTopLeft}
              fill="none"
              stroke={brandColors.tileFrame}
              strokeWidth={MARK_STROKE}
              strokeLinejoin="round"
            />
            <path
              d={markPaths.bracketBottomRight}
              fill="none"
              stroke={brandColors.tileFrame}
              strokeWidth={MARK_STROKE}
              strokeLinejoin="round"
            />
            <rect {...markCore} fill={brandColors.brandBright} />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
            scopelock
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: -2.4,
              color: "#ffffff",
            }}
          >
            Get paid for the extra work clients ask for.
          </div>
          <div style={{ fontSize: 26, color: muted, lineHeight: 1.35 }}>
            Scope, change requests, approvals and payments for freelancers,
            studios and agencies.
          </div>
        </div>
      </div>

      <div
        style={{
          marginLeft: "auto",
          alignSelf: "center",
          width: 430,
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          border: `1px solid ${line}`,
          background: "#111a2c",
          fontSize: 21,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "22px 26px",
            borderBottom: `1px solid ${line}`,
          }}
        >
          <span style={{ color: "#ffffff" }}>Original agreement</span>
          <span style={{ color: "#ffffff" }}>₹80,000</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.ref}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 26px",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: brandColors.brandBright,
              }}
            />
            <span style={{ color: muted, fontSize: 16 }}>{r.ref}</span>
            <span style={{ color: "#ffffff" }}>{r.title}</span>
            <span
              style={{
                marginLeft: "auto",
                color: "#ffffff",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {r.amount}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 8,
            padding: "22px 26px",
            borderTop: `1px solid ${line}`,
            background: "rgba(255,255,255,0.02)",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: muted, fontSize: 17 }}>
              Project value now
            </span>
            <span
              style={{
                color: "#ffffff",
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: -1.5,
              }}
            >
              ₹95,000
            </span>
          </div>
          <span style={{ color: brandColors.brandBright, fontSize: 18 }}>
            +₹15,000 recovered
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
