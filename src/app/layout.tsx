import type { Metadata, Viewport } from "next";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/tiro-devanagari-hindi/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reppy AI — the AI receptionist for WhatsApp and calls",
  description:
    "Reppy answers WhatsApp messages and calls, books appointments and collects UPI deposits in English, Hindi and Hinglish. Set up in two minutes.",
};

export const viewport: Viewport = {
  themeColor: "#08071a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-ink-950 text-fg">{children}</body>
    </html>
  );
}
