/**
 * Recommendation engine type definitions.
 *
 * CineMatch's recommendation system is a hybrid content-based engine that scores
 * candidate movies against a user-derived preference profile.
 */

import type { Movie } from "./tmdb";

// -----------------------------------------------------------------------------
// User taste profile
// -----------------------------------------------------------------------------

/**
 * Derived preference profile, computed from the user's likes, ratings, watchlist,
 * and viewing history. Frequencies are normalized so they sum to ~1 per facet.
 */
export interface UserProfile {
  /** Genre id -> normalized weight (0..1). */
  genres: Record<number, number>;
  /** Person id -> normalized weight (0..1). */
  actors: Record<number, number>;
  /** Person id -> normalized weight (0..1). */
  directors: Record<number, number>;
  /** Keyword id -> normalized weight (0..1). */
  keywords: Record<number, number>;
  /** Original language code -> normalized weight (0..1). */
  languages: Record<string, number>;
  /** Average rating the user gives across rated movies (1..10), or null if none. */
  averageRating: number | null;
  /** How many signals contributed to the profile — used for cold-start detection. */
  signalCount: number;
}

// -----------------------------------------------------------------------------
// Scoring
// -----------------------------------------------------------------------------

export type ReasonKind =
  | "genre"
  | "actor"
  | "director"
  | "keyword"
  | "language"
  | "similar"
  | "trending"
  | "hidden-gem"
  | "cold-start";

/**
 * Human-readable reason chip surfaced to the user, e.g.
 * "You enjoy Psychological Thrillers".
 */
export interface RecommendationReason {
  kind: ReasonKind;
  label: string;
  /** Optional weight contribution this reason adds to the final score (0..1). */
  weight?: number;
}

/**
 * Per-facet contributions to the final score. All values are in [0, 1] before
 * weighting, and the `total` is the weighted sum (also in [0, 1]).
 */
export interface ScoreBreakdown {
  genre: number;
  actor: number;
  director: number;
  keyword: number;
  popularity: number;
  total: number;
}

export interface ScoredMovie {
  movie: Movie;
  score: ScoreBreakdown;
  reasons: RecommendationReason[];
}

// -----------------------------------------------------------------------------
// Recommendation sections used on the Recommendations page
// -----------------------------------------------------------------------------

export type RecommendationSectionKind =
  | "for-you"
  | "because-you-liked"
  | "hidden-gems"
  | "trending-for-you"
  | "director-picks"
  | "genre-picks"
  | "actor-picks"
  | "recently-similar";

export interface RecommendationSection {
  kind: RecommendationSectionKind;
  title: string;
  description: string;
  movies: ScoredMovie[];
  /** Anchor entity (movie/person/genre) the section is built around, if any. */
  anchor?: { kind: "movie" | "person" | "genre"; id: number; name: string };
}
