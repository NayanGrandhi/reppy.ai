import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines may index the marketing pages, never the API, the sample
// dashboard, or private business chat links.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/chat$", "/setup"], disallow: ["/api/", "/dashboard", "/chat/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
