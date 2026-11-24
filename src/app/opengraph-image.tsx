// The preview card shown when the site is shared on WhatsApp, LinkedIn, X, etc.
// Generated once at build time.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Reppy AI: the AI receptionist for WhatsApp and calls";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const serif = await readFile(join(process.cwd(), "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(circle at 78% 42%, #3a2d9c 0%, #1a1450 28%, #08071a 62%)",
          color: "#eeecf8",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
          <svg width="44" height="44" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c4baff" />
                <stop offset="0.55" stopColor="#8b7bff" />
                <stop offset="1" stopColor="#e8934a" />
              </linearGradient>
            </defs>
            <path d="M16 3C8.8 3 3 8.4 3 15c0 3.2 1.4 6.1 3.6 8.3L5.5 29l6.1-2.7c1.4.4 2.9.7 4.4.7 7.2 0 13-5.4 13-12S23.2 3 16 3Z" fill="url(#g)" />
          </svg>
          <span style={{ fontWeight: 600 }}>Reppy</span>
          <span style={{ color: "#9893b5" }}>AI</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Instrument Serif", fontSize: 104, lineHeight: 1, letterSpacing: -2, display: "flex", flexDirection: "column" }}>
            <span>The receptionist</span>
            <span style={{ color: "#b4b0cc" }}>that never misses a customer.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#b4b0cc", display: "flex" }}>Answers WhatsApp and calls in English, Hindi and Hinglish. Books appointments. Takes UPI deposits.</div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24 }}>
          {["Salons", "Clinics", "Gyms", "Restaurants", "Repair shops"].map((t) => (
            <span key={t} style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", color: "#d6d3e8" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Instrument Serif", data: serif, style: "normal", weight: 400 }] },
  );
}
