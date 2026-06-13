/**
 * Per-candidate scoring.
 *
 * Given a `UserProfile` and a candidate movie (either a lightweight `Movie`
 * from a list endpoint or a fully-fetched `MovieDetails`), produce a
 * `ScoreBreakdown` and an aggregate 0–100 score using the documented
 * 40/20/15/15/10 weighting.
 *
 * Why two input shapes? List endpoints (`/movie/popular`, `/discover/movie`,
 * etc.) return ~20 movies in one round-trip but only include `genre_ids`. To
 * score the actor/director/keyword components we need credits + keywords,
 * which cost an extra request per movie. The engine intentionally accepts
 * the cheap shape and falls back to genre + popularity when details aren't
 * available — when details *are* available, the full 5-component score kicks
 * in.
 */

import type { Movie, MovieDetails } from "@/types/tmdb";

import { isHiddenGem } from "./hidden-gems";
import type { ScoreBreakdown, UserProfile } from "./types";
import {
  COMPONENT_WEIGHTS,
  POPULARITY_LOG_BASE,
  TOP_CAST_COUNT,
} from "./weights";

// -----------------------------------------------------------------------------
// Component scorers — each returns a value in [-1, 1]
// -----------------------------------------------------------------------------

/**
 * Average preference weight across the candidate's genres. Returns 0 when the
 * profile has no genre signal yet or the candidate lists no genres.
 */
function scoreGenres(
  genreIds: number[] | undefined,
  weights: Map<number, number>,
): number {
  if (!genreIds?.length || weights.size === 0) return 0;
  let total = 0;
  let matches = 0;
  for (const id of genreIds) {
    const w = weights.get(id);
    if (w != null) {
      total += w;
      matches += 1;
    }
  }
  if (matches === 0) return 0;
  return total / matches;
}

/**
 * Top-N cast contribution. Caps the slice to `TOP_CAST_COUNT` so a single
 * superstar doesn't drown out four other actors the user also follows.
 */
function scoreActors(
  details: MovieDetails | undefined,
  weights: Map<number, number>,
): number {
  if (!details?.credits?.cast?.length || weights.size === 0) return 0;
  const cast = details.credits.cast.slice(0, TOP_CAST_COUNT);
  let total = 0;
  let matches = 0;
  for (const member of cast) {
    const w = weights.get(member.id);
    if (w != null) {
      total += w;
      matches += 1;
    }
  }
  if (matches === 0) return 0;
  return total / matches;
}

/**
 * Director match — binary in practice: most movies have exactly one
 * credited Director, so this resolves to that director's weight or 0.
 */
function scoreDirector(
  details: MovieDetails | undefined,
  weights: Map<number, number>,
): number {
  const director = details?.credits?.crew?.find((c) => c.job === "Director");
  if (!director || weights.size === 0) return 0;
  return weights.get(director.id) ?? 0;
}

/**
 * Keyword overlap. Keywords (think tags like "time travel", "heist")
 * surface taste signals that genres alone miss.
 */
function scoreKeywords(
  details: MovieDetails | undefined,
  weights: Map<number, number>,
): number {
  const keywords = details?.keywords?.keywords;
  if (!keywords?.length || weights.size === 0) return 0;
  let total = 0;
  let matches = 0;
  for (const kw of keywords) {
    const w = weights.get(kw.id);
    if (w != null) {
      total += w;
      matches += 1;
    }
  }
  if (matches === 0) return 0;
  return total / matches;
}

/**
 * TMDB `popularity` is unbounded and skewed; we log-compress to [0, 1]. When
 * `invert` is true (hidden-gems mode) we flip the curve so obscure movies
 * score higher.
 */
function scorePopularity(popularity: number, invert: boolean): number {
  const safe = Math.max(0, popularity);
  const normalized = Math.min(1, Math.log(safe + 1) / POPULARITY_LOG_BASE);
  return invert ? 1 - normalized : normalized;
}

// -----------------------------------------------------------------------------
// Aggregate scorer
// -----------------------------------------------------------------------------

export interface ScoreContext {
  /**
   * Full `MovieDetails` for the candidate, if available. When omitted, only
   * the genre + popularity components contribute (actor/director/keyword
   * collapse to 0).
   */
  details?: MovieDetails;
  /** Invert popularity component for hidden-gems-only mode. */
  hiddenGemsOnly?: boolean;
}

export interface ScoreResult {
  /** Final 0–100 score (rounded). */
  score: number;
  breakdown: ScoreBreakdown;
  isHiddenGem: boolean;
}

/**
 * Score a single candidate against the user profile.
 *
 * Each component is computed in [-1, 1], multiplied by its `COMPONENT_WEIGHT`,
 * and summed. The total in [-1, 1] is then remapped to [0, 100] so the badge
 * UI can show an integer percentage.
 */
export function scoreCandidate(
  movie: Movie,
  profile: UserProfile,
  ctx: ScoreContext = {},
): ScoreResult {
  const details = ctx.details;
  const genreIds = details
    ? details.genres?.map((g) => g.id) ?? []
    : movie.genre_ids;

  const breakdown: ScoreBreakdown = {
    genre: scoreGenres(genreIds, profile.genreWeights),
    actor: scoreActors(details, profile.actorWeights),
    director: scoreDirector(details, profile.directorWeights),
    keyword: scoreKeywords(details, profile.keywordWeights),
    popularity: scorePopularity(movie.popularity, ctx.hiddenGemsOnly ?? false),
  };

  // Weighted sum in [-1, 1] — popularity is always non-negative.
  const weighted =
    breakdown.genre * COMPONENT_WEIGHTS.genre +
    breakdown.actor * COMPONENT_WEIGHTS.actor +
    breakdown.director * COMPONENT_WEIGHTS.director +
    breakdown.keyword * COMPONENT_WEIGHTS.keyword +
    breakdown.popularity * COMPONENT_WEIGHTS.popularity;

  // Remap [-1, 1] -> [0, 100] with a midpoint at 50 for neutral candidates.
  const score = Math.round(Math.max(0, Math.min(100, (weighted + 1) * 50)));

  return {
    score,
    breakdown,
    isHiddenGem: isHiddenGem(movie),
  };
}
