/**
 * sitemap.xml — Next.js Metadata Files convention.
 *
 * Lists only the static, publicly indexable routes. The personalized
 * `/recommendations` surface is intentionally omitted (it's noindex anyway).
 * Per-title `/movie/[id]` URLs are excluded too — TMDB has ~1M titles, the
 * set is unbounded, and any of them are equally discoverable from `/discover`.
 */

import type { MetadataRoute } from "next";

import { SITE_URL } from "@/constants/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/discover`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/onboarding`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
