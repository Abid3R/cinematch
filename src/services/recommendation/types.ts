/**
 * Recommendation engine types.
 *
 * The engine is intentionally framework-agnostic: it takes a `UserProfile`
 * (derived from Zustand store state) and a pool of candidate `Movie`s and
 * returns scored, ranked results with human-readable explanations.
 *
 * Keeping these types in their own module lets the engine, the stores, and the
 * UI components all share a single source of truth without circular imports.
 */

import type { Movie, MovieDetails } from "@/types/tmdb";

// -----------------------------------------------------------------------------
// User signals — the atoms of the recommendation system
// -----------------------------------------------------------------------------

/**
 * A single action a user has taken on a movie. The engine treats each signal
 * type with a different strength multiplier (see `SIGNAL_WEIGHTS` in scoring).
 */
export type UserSignalType =
  | "liked"
  | "disliked"
  | "watchlisted"
  | "watched"
  | "rated"
  | "onboarded_genre"
  | "search_clicked";

export interface UserSignal {
  type: UserSignalType;
  /** TMDB movie id (omitted for `onboarded_genre`). */
  movieId?: number;
  /** TMDB genre id (only for `onboarded_genre`). */
  genreId?: number;
  /** User's 0–10 rating, if `type === "rated"`. */
  rating?: number;
  /** ISO timestamp — used for recency weighting. */
  timestamp: string;
}

// -----------------------------------------------------------------------------
// User profile — the derived "taste fingerprint"
// -----------------------------------------------------------------------------

/**
 * A vector of weighted preferences derived from a user's signals. Built once
 * per recommendation run by `buildUserProfile` and then reused for every
 * candidate scoring call.
 *
 * Maps from entity id → preference weight in [-1, 1] where:
 *   +1 = strong love, 0 = neutral, -1 = strong dislike.
 */
export interface UserProfile {
  /** TMDB genre id → weight */
  genreWeights: Map<number, number>;
  /** TMDB person id → weight (actors) */
  actorWeights: Map<number, number>;
  /** TMDB person id → weight (directors) */
  directorWeights: Map<number, number>;
  /** TMDB keyword id → weight */
  keywordWeights: Map<number, number>;
  /** Lower-cased actor name → display name (used for explanations) */
  actorNames: Map<number, string>;
  /** Director id → display name */
  directorNames: Map<number, string>;
  /** Keyword id → display name */
  keywordNames: Map<number, string>;
  /** Genre id → display name */
  genreNames: Map<number, string>;
  /** Set of movie ids the user has already interacted with — excluded from results. */
  seenMovieIds: Set<number>;
  /** Movie ids the user explicitly disliked — hard-filtered. */
  dislikedMovieIds: Set<number>;
  /** Total number of signals — drives the cold-start branch. */
  signalCount: number;
  /** Whether we have enough signal to personalize (≥ COLD_START_THRESHOLD). */
  isPersonalized: boolean;
  /** Average rating the user has given (for normalizing rating signals). */
  averageRating: number;
}

// -----------------------------------------------------------------------------
// Scoring output
// -----------------------------------------------------------------------------

/**
 * Per-component breakdown of a movie's score. Surfaced in the UI as
 * "Why we recommended this" reason chips.
 */
export interface ScoreBreakdown {
  genre: number;
  actor: number;
  director: number;
  keyword: number;
  popularity: number;
}

/**
 * A single explanation chip rendered next to a recommended movie.
 * `kind` drives the icon; `label` is the user-facing copy.
 */
export interface RecommendationReason {
  kind: "genre" | "actor" | "director" | "keyword" | "popular" | "hidden_gem" | "similar";
  label: string;
  /** 0–1 confidence — drives chip intensity. */
  weight: number;
}

/**
 * The full scored recommendation, ready for the UI. Sorted by `score` desc.
 */
export interface ScoredRecommendation {
  movie: Movie;
  /** Final score in [0, 100] — what the badge displays. */
  score: number;
  breakdown: ScoreBreakdown;
  reasons: RecommendationReason[];
  isHiddenGem: boolean;
}

// -----------------------------------------------------------------------------
// Engine input
// -----------------------------------------------------------------------------

/**
 * The signal sources the engine pulls from. Each map keys a TMDB movie id to
 * the full detail object so we can score against credits/keywords without
 * extra round-trips.
 *
 * Stores hold ids; the engine resolves them to details (cached) before
 * calling `buildUserProfile`.
 */
export interface UserSignalSources {
  liked: Map<number, MovieDetails>;
  disliked: Map<number, MovieDetails>;
  watchlist: Map<number, MovieDetails>;
  watched: Map<number, MovieDetails>;
  /** Movie id → 0–10 rating */
  ratings: Map<number, { rating: number; details: MovieDetails }>;
  /** Genre ids selected during onboarding (cold-start seed). */
  onboardingGenres: number[];
}

export interface RecommendOptions {
  /** Maximum number of results to return. Defaults to 20. */
  limit?: number;
  /**
   * Whether to include movies the user has already seen.
   * Defaults to `false` for the main feed, `true` for analytics.
   */
  includeSeen?: boolean;
  /**
   * Bias toward lesser-known movies. Defaults to `false`.
   * When `true`, the popularity component is inverted.
   */
  hiddenGemsOnly?: boolean;
  /**
   * Minimum score (0–100) to include in results. Defaults to 0.
   */
  minScore?: number;
}
