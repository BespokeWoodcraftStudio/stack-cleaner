import { ImageResponse } from "next/og";
import { MARK_DATA_URI } from "@/lib/og-mark";

export const alt = "Claude Inventory Tool — see, organize, and clean up your Claude setup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand-consistent social card. Generated at build time as a static asset, so a
// failure here surfaces in `next build` (our verification gate).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#141210",
          backgroundImage:
            "radial-gradient(900px 520px at 50% -12%, rgba(217,119,87,0.20), transparent 60%), radial-gradient(720px 440px at 100% 0%, rgba(199,155,240,0.12), transparent 55%)",
          color: "#f4efe8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK_DATA_URI} width={108} height={108} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 25,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#e69a80",
              fontWeight: 700,
            }}
          >
            Free · open source · runs locally
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 90, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>
            Claude Inventory Tool
          </div>
          <div style={{ display: "flex", fontSize: 37, color: "#d8cfc4", lineHeight: 1.32, maxWidth: 1000 }}>
            See, organize, and clean up your Claude skills, plugins, MCP servers &amp; agents — split by global vs. project.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <Pill label="Global" color="#c79bf0" />
            <Pill label="Project" color="#6fc7c0" />
            <Pill label="Real usage" color="#74c47a" />
          </div>
          <div style={{ display: "flex", fontSize: 27, color: "#e69a80" }}>claude-inventory-tool.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: 27,
        fontWeight: 600,
        color,
        background: `${color}22`,
        border: `1px solid ${color}66`,
        borderRadius: 999,
        padding: "8px 24px",
      }}
    >
      {label}
    </div>
  );
}
