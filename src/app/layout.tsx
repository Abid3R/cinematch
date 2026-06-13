/**
 * Root layout — the only layout in the app.
 *
 * Mounts global providers (React Query), the persistent chrome (navbar +
 * footer + animated background), and top-level UI (toaster + command palette).
 * Also exports rich `Metadata` for SEO and an inline FOUC-guard script so the
 * first paint respects the user's persisted theme.
 *
 * The page wrapper is a `<main>` so screen readers land on content; the
 * `min-h-svh` plus `flex-col` keeps the footer pinned to the viewport bottom
 * on short pages without resorting to absolute positioning.
 */

import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import type { ReactNode } from "react";

import { AnimatedBackground, Footer, Navbar } from "@/components/layout";
import { CommandPalette, Toaster } from "@/components/ui";
import {
  DEFAULT_LOCALE,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  STORAGE_KEYS,
} from "@/constants/site";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";

// -----------------------------------------------------------------------------
// Fonts
// -----------------------------------------------------------------------------

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

// -----------------------------------------------------------------------------
// Metadata
// -----------------------------------------------------------------------------

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: DEFAULT_LOCALE.replace("-", "_"),
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
};

// -----------------------------------------------------------------------------
// FOUC guard — runs synchronously before the React tree paints
// -----------------------------------------------------------------------------

const themeBootstrap = `
(function () {
  try {
    var k = ${JSON.stringify(STORAGE_KEYS.theme)};
    var raw = localStorage.getItem(k);
    var mode = "dark";
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.state && parsed.state.mode) mode = parsed.state.mode;
      } catch (_) {}
    }
    if (mode === "system") {
      mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(mode);
    root.style.colorScheme = mode;
  } catch (_) {
    document.documentElement.classList.add("dark");
  }
})();
`;

// -----------------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------------

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // FOUC-guard: runs before React hydrates so the first paint matches
          // the persisted theme. Safe because the payload is a string literal.
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
      </head>
      <body className="min-h-svh bg-bg text-ink antialiased">
        <AnimatedBackground />
        <QueryProvider>
          <div className="relative flex min-h-svh flex-col">
            <Navbar />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
          <CommandPalette />
        </QueryProvider>
      </body>
    </html>
  );
}
