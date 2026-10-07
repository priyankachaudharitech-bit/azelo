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
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "48px" }}>
          <svg
            viewBox="0 0 100 100"
            style={{ width: "80px", height: "80px" }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 84 L40 19 Q42 14 47 14 L53 14 L31 84 Z" fill="#F5F7FA" />
            <path d="M51 14 Q57 14 60 20 L92 84 L70 84 L48 34 Z" fill="#F5F7FA" />
            <path d="M35 69 L62 69 L67 79 L30 79 Z" fill="#22D3EE" />
          </svg>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#F5F7FA",
              letterSpacing: "0.075em",
              fontFamily: "system-ui, sans-serif",
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
            fontFamily: "system-ui, sans-serif",
          }}
        >
          AI Automation & Full-Stack Systems
        </div>

        <div
          style={{
            fontSize: "24px",
            color: "#9CA6B5",
            textAlign: "left",
            fontFamily: "system-ui, sans-serif",
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
