import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AZELO — AI Automation & Full-Stack Systems";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#070A0F",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "48px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- OG image generation, not browser rendering */}
          <img
            src="/azelo-logo.png"
            alt="AZELO"
            style={{ width: "auto", height: "80px", objectFit: "contain" }}
          />
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#F5F7FA",
              letterSpacing: "0.075em",
              fontFamily: "Manrope, system-ui, sans-serif",
              lineHeight: 1,
            }}
          >
            AZELO
          </span>
        </div>

        <div
          style={{
            fontSize: "48px",
            fontWeight: 600,
            color: "#F5F7FA",
            textAlign: "left",
            lineHeight: 1.2,
            maxWidth: "900px",
            marginBottom: "20px",
            fontFamily: "Manrope, system-ui, sans-serif",
          }}
        >
          AI Automation &amp; Full-Stack Systems
        </div>

        <div
          style={{
            fontSize: "24px",
            color: "#9CA6B5",
            textAlign: "left",
            fontFamily: "Manrope, system-ui, sans-serif",
          }}
        >
          Build smarter. Automate better.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "80px",
            width: "120px",
            height: "4px",
            backgroundColor: "#22D3EE",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
