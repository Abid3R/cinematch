/**
 * Onboarding route layout — provides per-route metadata only.
 *
 * The onboarding flow is a client component (Zustand store, motion, search
 * inputs). This server-only layout adds SEO without disturbing that
 * boundary. We let it index — the page is a generic landing for the
 * preference flow, not personalized output.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SITE_NAME } from "@/constants/site";

export const metadata: Metadata = {
  title: "Get started",
  description:
    "Tell " +
    SITE_NAME +
    " what you love — favorite genres, actors, directors, and a few movies you've already enjoyed. We turn that into a taste profile and start recommending in seconds.",
  alternates: { canonical: "/onboarding" },
  openGraph: {
    title: `Get started · ${SITE_NAME}`,
    description:
      "Build your taste profile in four quick steps and get recommendations tailored to you.",
    url: "/onboarding",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Get started · ${SITE_NAME}`,
    description:
      "Build your taste profile in four quick steps and get recommendations tailored to you.",
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
