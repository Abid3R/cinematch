/**
 * TMDB image URL builders.
 *
 * TMDB returns relative `poster_path` / `backdrop_path` / `profile_path` values
 * (e.g. "/abc123.jpg") that must be joined with their CDN base + a named size
 * (e.g. "w500"). These helpers centralize that join, accept the same size keys
 * we use everywhere (`xs`/`sm`/`md`/...), and return safe placeholders when the
 * source path is missing.
 */

import {
  BACKDROP_SIZES,
  POSTER_SIZES,
  PROFILE_SIZES,
  TMDB_IMAGE_BASE_URL,
  YOUTUBE_THUMB_BASE_URL,
  type BackdropSize,
  type PosterSize,
  type ProfileSize,
} from "@/constants/tmdb";

// -----------------------------------------------------------------------------
// Placeholders — kept as inline SVG data URLs so they never trigger a network
// request and gracefully fill the space while real artwork is missing.
// -----------------------------------------------------------------------------

export const PLACEHOLDER_POSTER =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%230a0a0f'/%3E%3Cpath d='M70 130h60v40H70z' fill='%231a1a25'/%3E%3Ccircle cx='100' cy='118' r='10' fill='%231a1a25'/%3E%3C/svg%3E";

export const PLACEHOLDER_BACKDROP =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%230a0a0f'/%3E%3C/svg%3E";

export const PLACEHOLDER_PROFILE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 185 278'%3E%3Crect width='185' height='278' fill='%230a0a0f'/%3E%3Ccircle cx='92' cy='110' r='34' fill='%231a1a25'/%3E%3Cpath d='M30 240c0-34 28-62 62-62s62 28 62 62z' fill='%231a1a25'/%3E%3C/svg%3E";

// -----------------------------------------------------------------------------
// Builders
// -----------------------------------------------------------------------------

function build(path: string | null | undefined, size: string, fallback: string): string {
  if (!path) return fallback;
  // TMDB paths always start with "/", but normalize defensively.
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${normalized}`;
}

export function getPosterUrl(
  path: string | null | undefined,
  size: PosterSize = "lg",
): string {
  return build(path, POSTER_SIZES[size], PLACEHOLDER_POSTER);
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: BackdropSize = "lg",
): string {
  return build(path, BACKDROP_SIZES[size], PLACEHOLDER_BACKDROP);
}

export function getProfileUrl(
  path: string | null | undefined,
  size: ProfileSize = "md",
): string {
  return build(path, PROFILE_SIZES[size], PLACEHOLDER_PROFILE);
}

// -----------------------------------------------------------------------------
// YouTube thumbnail — "abc123" → "https://img.youtube.com/vi/abc123/hqdefault.jpg"
//
// Quality keys per YouTube's static thumbnail API:
//   default   →  120 x  90
//   mqdefault →  320 x 180
//   hqdefault →  480 x 360
//   sddefault →  640 x 480
//   maxresdefault → 1280 x 720 (not always available)
// -----------------------------------------------------------------------------

export type YouTubeThumbQuality =
  | "default"
  | "mqdefault"
  | "hqdefault"
  | "sddefault"
  | "maxresdefault";

export function getYouTubeThumb(
  key: string | null | undefined,
  quality: YouTubeThumbQuality = "hqdefault",
): string {
  if (!key) return PLACEHOLDER_BACKDROP;
  return `${YOUTUBE_THUMB_BASE_URL}/${key}/${quality}.jpg`;
}

export function getYouTubeEmbedUrl(key: string): string {
  return `https://www.youtube.com/embed/${key}`;
}

export function getYouTubeWatchUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${key}`;
}
