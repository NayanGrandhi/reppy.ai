import type { NextConfig } from "next";

// STATIC_EXPORT=1 npm run build  -> plain HTML/CSS/JS in /out (for previews / static hosting).
// Leave it unset once real backend routes (WhatsApp webhooks etc.) are added.
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT ? { output: "export" as const, trailingSlash: true } : {}),
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
