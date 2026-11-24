import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

// Fonts are self-hosted and preloaded by Next.js, with fallback fonts sized to
// match, so text doesn't jump when the real font arrives.
const sans = localFont({ src: "../fonts/hanken-grotesk-latin-var.woff2", variable: "--font-hanken", weight: "100 900", display: "swap" });
const serif = localFont({
  src: [
    { path: "../fonts/instrument-serif-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-serif-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["Georgia", "serif"],
});
const deva = localFont({ src: "../fonts/tiro-devanagari-400.woff2", variable: "--font-tiro", weight: "400", display: "swap", preload: false });

const description =
  "Reppy answers WhatsApp messages and calls, books appointments and collects UPI deposits in English, Hindi and Hinglish. Set up in two minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Reppy AI — the AI receptionist for WhatsApp and calls", template: "%s — Reppy AI" },
  description,
  applicationName: "Reppy AI",
  keywords: ["AI receptionist", "WhatsApp receptionist", "Hinglish chatbot", "salon booking", "clinic appointments", "India"],
  openGraph: { type: "website", siteName: "Reppy AI", locale: "en_IN", url: "/", title: "Reppy AI — the AI receptionist for WhatsApp and calls", description },
  twitter: { card: "summary_large_image", title: "Reppy AI — the AI receptionist for WhatsApp and calls", description },
};

export const viewport: Viewport = {
  themeColor: "#08071a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${deva.variable}`}>
      <body className="min-h-dvh bg-ink-950 text-fg">{children}</body>
    </html>
  );
}
