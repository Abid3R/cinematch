/**
 * Recommendation engine constants.
 *
 * Centralizes the weights, thresholds, and section copy used by the hybrid
 * content-based recommender. Keeping these here (rather than scattered through
 * the engine) makes it easy to tune the recommender without hunting through
 * scoring logic.
 */

import type { RecommendationSectionKind } from "@/types/recommendation";

// -----------------------------------------------------------------------------
// Scoring weights — must sum to 1.0
// -----------------------------------------------------------------------------

export const GENRE_WEIGHT = 0.4;
export const ACTOR_WEIGHT = 0.2;
export const DIRECTOR_WEIGHT = 0.15;
export const KEYWORD_WEIGHT = 0.15;
export const POPULARITY_WEIGHT = 0.1;

export const SCORING_WEIGHTS = {
  genre: GENRE_WEIGHT,
  actor: ACTOR_WEIGHT,
  director: DIRECTOR_WEIGHT,
  keyword: KEYWORD_WEIGHT,
  popularity: POPULARITY_WEIGHT,
} as const;

// -----------------------------------------------------------------------------
// Cold-start detection
// -----------------------------------------------------------------------------

/** Below this number of signals (likes + ratings + watchlist), we treat the
 *  user as cold-started and fall back to onboarding-driven recommendations. */
export const COLD_START_SIGNAL_THRESHOLD = 5;

// -----------------------------------------------------------------------------
// Hidden gem detection
// -----------------------------------------------------------------------------

/** Minimum TMDB vote average a movie needs to qualify as a hidden gem. */
export const HIDDEN_GEM_MIN_VOTE_AVERAGE = 7.5;

/** Minimum vote count — filters out movies with one 10/10 review. */
export const HIDDEN_GEM_MIN_VOTE_COUNT = 200;

/** Maximum popularity score above which a movie is considered too mainstream
 *  to be a "hidden" gem. */
export const HIDDEN_GEM_MAX_POPULARITY = 30;

// -----------------------------------------------------------------------------
// Output limits
// -----------------------------------------------------------------------------

export const MAX_RECOMMENDATIONS_PER_SECTION = 20;
export const MAX_REASONS_PER_RECOMMENDATION = 3;

// -----------------------------------------------------------------------------
// Section copy — title + description per RecommendationSectionKind
// -----------------------------------------------------------------------------

export const SECTION_COPY: Record<
  RecommendationSectionKind,
  { title: string; description: string }
> = {
  "for-you": {
    title: "For You",
    description: "Tailored picks based on your taste profile.",
  },
  "because-you-liked": {
    title: "Because You Liked",
    description: "More movies that share DNA with the ones you loved.",
  },
  "hidden-gems": {
    title: "Hidden Gems",
    description: "Critically loved films you might have missed.",
  },
  "trending-for-you": {
    title: "Trending For You",
    description: "What's hot this week, filtered through your taste.",
  },
  "director-picks": {
    title: "From Your Favorite Directors",
    description: "Films by directors you keep coming back to.",
  },
  "genre-picks": {
    title: "Your Top Genres",
    description: "Standouts in the genres you watch most.",
  },
  "actor-picks": {
    title: "Starring Actors You Love",
    description: "Roles from the faces you can't get enough of.",
  },
  "recently-similar": {
    title: "Because You Recently Watched",
    description: "Picks inspired by what you've been viewing lately.",
  },
};
