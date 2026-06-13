/**
 * Hidden-gem detection.
 *
 * A "hidden gem" is a high-quality movie that hasn't broken into the
 * mainstream — great `vote_average` with enough votes to trust, but low
 * `popularity`. Surfacing these is a key product differentiator; the home
 * feed reserves a dedicated row for them and the engine emits a
 * `hidden_gem` reason chip whenever a candidate qualifies.
 */

import type { Movie } from "@/types/tmdb";

import { HIDDEN_GEM_CRITERIA } from "./weights";

/**
 * Returns `true` if a movie satisfies all three hidden-gem criteria.
 *
 * Criteria (all configurable via `HIDDEN_GEM_CRITERIA`):
 *  - `vote_average >= 7.5` — actually well-reviewed
 *  - `vote_count   >= 200` — enough samples to trust the rating
 *  - `popularity   <= 30`  — not a mainstream hit
 */
export function isHiddenGem(movie: Pick<Movie, "vote_average" | "vote_count" | "popularity">): boolean {
  return (
    movie.vote_average >= HIDDEN_GEM_CRITERIA.minVoteAverage &&
    movie.vote_count >= HIDDEN_GEM_CRITERIA.minVoteCount &&
    movie.popularity <= HIDDEN_GEM_CRITERIA.maxPopularity
  );
}

/**
 * Compute a 0–1 "gem score" so the engine can rank gems against each other
 * for the dedicated row. Combines quality (vote_average normalized to [0, 1])
 * with obscurity (inverted popularity).
 */
export function hiddenGemScore(
  movie: Pick<Movie, "vote_average" | "popularity">,
): number {
  const quality = Math.min(1, Math.max(0, (movie.vote_average - 6) / 4));
  const obscurity = Math.max(0, 1 - movie.popularity / 100);
  return quality * 0.7 + obscurity * 0.3;
}
