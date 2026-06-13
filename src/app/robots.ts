/**
 * robots.txt — Next.js Metadata Files convention.
 *
 * Allows the catalog-facing routes (home, discover, movie details, onboarding)
 * and disallows the personalized recommendations surface, which is rendered
 * from per-device taste signals and has no value for crawlers.
 */

import type { MetadataRoute } from "next";

import { SITE_URL } from "@/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/recommendations", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
