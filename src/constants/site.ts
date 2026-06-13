/**
 * Site-wide metadata and navigation constants.
 *
 * Centralizes the brand name, marketing copy, SEO defaults, and primary
 * navigation links. Pages, layout, and metadata generators all read from here
 * so a rename / rebrand only requires editing this file.
 */

import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Home,
  Sparkles,
  User,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Brand
// -----------------------------------------------------------------------------

export const SITE_NAME = "CineMatch";
export const SITE_TAGLINE = "Discover movies that match your taste.";
export const SITE_DESCRIPTION =
  "CineMatch is an AI-powered movie discovery platform that learns what you love and surfaces films you'll actually want to watch — trending picks, hidden gems, and personalized recommendations with reasons.";

export const SITE_KEYWORDS = [
  "movies",
  "movie recommendations",
  "AI movie recommendations",
  "personalized movies",
  "film discovery",
  "watchlist",
  "trending movies",
  "hidden gems",
  "movie reviews",
  "TMDB",
];

// -----------------------------------------------------------------------------
// URLs
// -----------------------------------------------------------------------------

/** Public site URL, used for canonical links and OG tags. Overridable via env. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cinematch.app";

export const OG_IMAGE = `${SITE_URL}/og.jpg`;

// -----------------------------------------------------------------------------
// Primary navigation — rendered in the navbar
// -----------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** When true, only highlight the item on an exact path match (vs. prefix). */
  exact?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home, exact: true },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Recommendations", href: "/recommendations", icon: Sparkles },
  { label: "Profile", href: "/profile", icon: User },
];

// -----------------------------------------------------------------------------
// Footer
// -----------------------------------------------------------------------------

export const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Discover", href: "/discover" },
  { label: "Recommendations", href: "/recommendations" },
  { label: "Profile", href: "/profile" },
  { label: "Onboarding", href: "/onboarding" },
];

// -----------------------------------------------------------------------------
// Localization defaults
// -----------------------------------------------------------------------------

export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_CURRENCY = "USD";

// -----------------------------------------------------------------------------
// Storage keys — used by Zustand persist middleware
// -----------------------------------------------------------------------------

export const STORAGE_KEYS = {
  watchlist: "cinematch:watchlist",
  likes: "cinematch:likes",
  ratings: "cinematch:ratings",
  searchHistory: "cinematch:search-history",
  viewHistory: "cinematch:view-history",
  onboarding: "cinematch:onboarding",
  theme: "cinematch:theme",
} as const;
