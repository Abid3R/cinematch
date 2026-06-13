/**
 * Recommendations route layout — provides per-route metadata only.
 *
 * Recommendations are derived per-device from persisted taste signals
 * (likes, ratings, watchlist, onboarding picks), so the page itself is a
 * client component. This server-only layout adds SEO without disturbing
 * that boundary.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SITE_NAME } from "@/constants/site";

export const metadata: Metadata = {
  title: "Your picks",
  description:
    "Personalized movie recommendations from " +
    SITE_NAME +
    ", scored on genre fit, cast overlap, director affinity, keyword similarity, and popularity — with a reason for every pick.",
  alternates: { canonical: "/recommendations" },
  openGraph: {
    title: `Your picks · ${SITE_NAME}`,
    description:
      "Personalized movie recommendations with a reason for every pick.",
    url: "/recommendations",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Your picks · ${SITE_NAME}`,
    description:
      "Personalized movie recommendations with a reason for every pick.",
  },
  robots: {
    // Personalized output — let crawlers know there's nothing public here.
    index: false,
    follow: true,
  },
};

export default function RecommendationsLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
