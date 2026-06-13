/**
 * Tunable weights for the recommendation engine.
 *
 * These constants are deliberately concentrated in one module so product can
 * iterate on the model's behavior (e.g. "boost director weight by 5%") without
 * spelunking through scoring code. Every number is documented with the
 * rationale behind its current value.
 */

import type { UserSignalType } from "./types";

// -----------------------------------------------------------------------------
// Component weights — must sum to 1.0
// -----------------------------------------------------------------------------

/**
 * The classic CineMatch 40/20/15/15/10 split.
 *
 * Genre dominates because every candidate has genre data (it ships on the
 * lightweight `Movie` shape from list endpoints), while actor/director/keyword
 * signals require `MovieDetails` and only contribute when we have enriched
 * candidates. Popularity acts as a tiebreaker for the long tail.
 */
export const COMPONENT_WEIGHTS = {
  genre: 0.4,
  actor: 0.2,
  director: 0.15,
  keyword: 0.15,
  popularity: 0.1,
} as const;

// -----------------------------------------------------------------------------
// Signal weights — how much each user action contributes to the profile
// -----------------------------------------------------------------------------

/**
 * Per-signal-type multipliers applied while building the user profile.
 *
 * `rated` is intentionally absent here; ratings are normalized against the
 * user's own average (so a 4-star user giving a 5 still counts as positive)
 * inside `buildUserProfile`.
 */
export const SIGNAL_WEIGHTS: Record<
  Exclude<UserSignalType, "rated">,
  number
> = {
  liked: 1.0,
  watchlisted: 0.5,
  watched: 0.3,
  disliked: -1.0,
  onboarded_genre: 0.6,
  search_clicked: 0.15,
};

// -----------------------------------------------------------------------------
// Profile-building thresholds
// -----------------------------------------------------------------------------

/**
 * Number of signals before we switch from cold-start (trending + onboarding
 * genres) to a fully personalized feed. Tuned low so users feel personalization
 * kick in after just a few interactions.
 */
export const COLD_START_THRESHOLD = 5;

/**
 * Only the top-N cast members of a movie contribute to actor weights.
 * Otherwise B-list players in star-studded ensembles get inflated influence.
 */
export const TOP_CAST_COUNT = 5;

/**
 * Recency decay half-life in days. A signal from 30 days ago contributes half
 * as much as one from today. Disabled when set to `null`.
 */
export const RECENCY_HALF_LIFE_DAYS: number | null = 60;

// -----------------------------------------------------------------------------
// Hidden gem detection
// -----------------------------------------------------------------------------

export const HIDDEN_GEM_CRITERIA = {
  /** TMDB rating must be at least this high. */
  minVoteAverage: 7.5,
  /** Need enough votes to trust the rating. */
  minVoteCount: 200,
  /** But popularity must be below this — otherwise it's a mainstream hit. */
  maxPopularity: 30,
} as const;

// -----------------------------------------------------------------------------
// Popularity normalization
// -----------------------------------------------------------------------------

/**
 * TMDB popularity is unbounded (typically 0–1000+). We log-compress and clamp
 * so the popularity component stays in [0, 1] without one viral release
 * dominating the feed.
 */
export const POPULARITY_LOG_BASE = Math.log(1000);
