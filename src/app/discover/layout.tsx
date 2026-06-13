/**
 * Discover route layout — provides per-route metadata only.
 *
 * The Discover page is a client component (it relies on URL search params and
 * React Query), so it cannot export `metadata` directly. A server-component
 * layout here gives us per-route SEO without forcing a server/client split of
 * the page logic itself.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SITE_NAME } from "@/constants/site";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Browse and filter the full catalog — by genre, year, rating, runtime, language, and sort order. The most powerful way to find your next movie on " +
    SITE_NAME +
    ".",
  alternates: { canonical: "/discover" },
  openGraph: {
    title: `Discover · ${SITE_NAME}`,
    description:
      "Filter and sort the full TMDB catalog to find your next watch.",
    url: "/discover",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Discover · ${SITE_NAME}`,
    description:
      "Filter and sort the full TMDB catalog to find your next watch.",
  },
};

export default function DiscoverLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
