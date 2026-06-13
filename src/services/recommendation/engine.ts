/**
 * Recommendation engine — orchestrator.
 *
 * Glues `buildUserProfile`, `scoreCandidate`, `generateReasons`, and the
 * hidden-gem helpers into the single `recommend()` entry point consumed by
 * React Query hooks and server components.
 *
 * Design notes:
 *  - The engine is *pure*: it doesn't fetch. Callers pass in the candidate
 *    pool (already paginated from TMDB) and an optional `detailsMap` of
 *    enriched data. This makes the engine trivially unit-testable and lets
 *    the caching layer (React Query / Next data cache) live one level up.
 *  - Hard filters (seen / disliked) happen *before* scoring so we never waste
 *    cycles on candidates that won't be shown.
 *  - Sort is stable on `score` then `popularity` so ties resolve deterministically.
 */

import type { Movie, MovieDetails } from "@/types/tmdb";

import { generateReasons } from "./explanations";
import { hiddenGemScore, isHiddenGem } from "./hidden-gems";
import { scoreCandidate } from "./scoring";
import type {
  RecommendOptions,
  ScoredRecommendation,
  UserProfile,
} from "./types";

// -----------------------------------------------------------------------------
// Main entry point
// -----------------------------------------------------------------------------

/**
 * Score a pool of candidate movies against the user profile and return them
 * ranked. Mutually exclusive flow control:
 *  - `hiddenGemsOnly: true`  → only candidates that satisfy `isHiddenGem` survive
 *  - `includeSeen: false` (default) → filter `seenMovieIds`
 *  - Disliked movies are *always* filtered, no opt-out.
 */
export function recommend(
  candidates: Movie[],
  profile: UserProfile,
  options: RecommendOptions = {},
  detailsMap?: Map<number, MovieDetails>,
): ScoredRecommendation[] {
  const {
    limit = 20,
    includeSeen = false,
    hiddenGemsOnly = false,
    minScore = 0,
  } = options;

  // Dedupe candidates (TMDB occasionally repeats across pages near the cursor).
  const seen = new Set<number>();
  const pool: Movie[] = [];
  for (const movie of candidates) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    pool.push(movie);
  }

  const results: ScoredRecommendation[] = [];

  for (const movie of pool) {
    // Hard filters --------------------------------------------------------
    if (profile.dislikedMovieIds.has(movie.id)) continue;
    if (!includeSeen && profile.seenMovieIds.has(movie.id)) continue;
    if (hiddenGemsOnly && !isHiddenGem(movie)) continue;

    // Score ---------------------------------------------------------------
    const { score, breakdown, isHiddenGem: gem } = scoreCandidate(
      movie,
      profile,
      {
        details: detailsMap?.get(movie.id),
        hiddenGemsOnly,
      },
    );

    if (score < minScore) continue;

    const reasons = generateReasons(
      movie,
      detailsMap?.get(movie.id),
      profile,
      breakdown,
    );

    results.push({
      movie,
      score,
      breakdown,
      reasons,
      isHiddenGem: gem,
    });
  }

  // Sort: score desc, then popularity desc as deterministic tiebreaker.
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.movie.popularity - a.movie.popularity;
  });

  return results.slice(0, limit);
}

// -----------------------------------------------------------------------------
// Hidden-gems convenience
// -----------------------------------------------------------------------------

/**
 * Curated "Hidden Gems for You" row.
 *
 * Pre-filters by `isHiddenGem`, then ranks by a blend of personalization
 * score (70%) and raw gem-score (30%) so the row stays personalized but still
 * surfaces objectively-great obscure picks even when the user's profile is
 * sparse.
 */
export function recommendHiddenGems(
  candidates: Movie[],
  profile: UserProfile,
  options: Omit<RecommendOptions, "hiddenGemsOnly"> = {},
  detailsMap?: Map<number, MovieDetails>,
): ScoredRecommendation[] {
  const { limit = 12, includeSeen = false, minScore = 0 } = options;

  const gems = candidates.filter(isHiddenGem);

  const scored = recommend(
    gems,
    profile,
    {
      ...options,
      // Inside recommend(), this just inverts the popularity component for an
      // already-pre-filtered pool — pushes the most obscure gems higher.
      hiddenGemsOnly: true,
      // Pass through limit/includeSeen/minScore so semantics match.
      limit: Math.max(limit * 3, limit),
      includeSeen,
      minScore,
    },
    detailsMap,
  );

  // Blend personalization with gem-score so cold-start users still see great
  // picks (the personalization component dominates once profile.signalCount
  // crosses COLD_START_THRESHOLD inside scoreCandidate).
  const blended = scored.map((r) => {
    const gem = hiddenGemScore(r.movie);
    const blendedScore = Math.round(r.score * 0.7 + gem * 100 * 0.3);
    return { ...r, score: Math.max(0, Math.min(100, blendedScore)) };
  });

  blended.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.movie.vote_average - a.movie.vote_average;
  });

  return blended.slice(0, limit);
}

// -----------------------------------------------------------------------------
// Similar-movies helper
// -----------------------------------------------------------------------------

/**
 * Rank a pool of TMDB "similar" or "recommendations" candidates against the
 * user profile so the Movie Details page can show personalized "Because you
 * liked X" rows. Identical to `recommend()` but exposed as a separate symbol
 * so callsites read clearly.
 */
export function rankSimilar(
  seedMovie: Movie,
  candidates: Movie[],
  profile: UserProfile,
  options: RecommendOptions = {},
  detailsMap?: Map<number, MovieDetails>,
): ScoredRecommendation[] {
  // Don't let the seed itself end up in its own "similar" row.
  const filtered = candidates.filter((m) => m.id !== seedMovie.id);
  return recommend(filtered, profile, options, detailsMap);
}
