/**
 * User-profile builder.
 *
 * Transforms raw user signals (likes, watchlist, ratings, etc.) into a dense
 * weighted preference vector that the scoring engine can dot-product against
 * any candidate movie. This is the *content-based filtering* half of the
 * hybrid recommender — collaborative signals could later be layered on top
 * without changing the engine's contract.
 *
 * Build cost is O(signals × top_cast) which, for the size of any one user's
 * activity, is effectively constant. We memoize at the React Query layer.
 */

import type { CastMember, CrewMember, MovieDetails } from "@/types/tmdb";

import type { UserProfile, UserSignalSources } from "./types";
import {
  COLD_START_THRESHOLD,
  RECENCY_HALF_LIFE_DAYS,
  SIGNAL_WEIGHTS,
  TOP_CAST_COUNT,
} from "./weights";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Mutably add `delta` to `map[key]`, defaulting to 0. */
function bump(map: Map<number, number>, key: number, delta: number): void {
  map.set(key, (map.get(key) ?? 0) + delta);
}

/** Mutably record `name` under `id` if not already present. */
function remember(map: Map<number, string>, id: number, name: string): void {
  if (!map.has(id)) map.set(id, name);
}

/** Find the first credited Director on a crew list. */
function findDirector(crew: CrewMember[] | undefined): CrewMember | undefined {
  return crew?.find((c) => c.job === "Director");
}

/** Top-N cast slice — guards against undefined credits. */
function topCast(cast: CastMember[] | undefined): CastMember[] {
  return cast?.slice(0, TOP_CAST_COUNT) ?? [];
}

/**
 * Exponential recency decay. Older signals contribute less so users' tastes
 * can shift over time without being anchored to ancient activity.
 */
function recencyMultiplier(timestamp?: string): number {
  if (!timestamp || RECENCY_HALF_LIFE_DAYS == null) return 1;
  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(ageMs) || ageMs <= 0) return 1;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Normalize a weight map to [-1, 1] by dividing by the largest absolute value.
 * Empty maps are left as-is.
 */
function normalize(map: Map<number, number>): void {
  let max = 0;
  for (const v of map.values()) {
    const abs = Math.abs(v);
    if (abs > max) max = abs;
  }
  if (max === 0) return;
  for (const [k, v] of map) {
    map.set(k, v / max);
  }
}

/**
 * Apply one movie's content (genres, top cast, director, keywords) to the
 * accumulating profile with a scalar `weight`. Display names are recorded so
 * the explanation layer doesn't need to re-fetch person/keyword names.
 */
function applyMovieSignal(
  details: MovieDetails,
  weight: number,
  acc: {
    genres: Map<number, number>;
    actors: Map<number, number>;
    directors: Map<number, number>;
    keywords: Map<number, number>;
    genreNames: Map<number, string>;
    actorNames: Map<number, string>;
    directorNames: Map<number, string>;
    keywordNames: Map<number, string>;
  },
): void {
  for (const g of details.genres ?? []) {
    bump(acc.genres, g.id, weight);
    remember(acc.genreNames, g.id, g.name);
  }
  for (const actor of topCast(details.credits?.cast)) {
    bump(acc.actors, actor.id, weight);
    remember(acc.actorNames, actor.id, actor.name);
  }
  const director = findDirector(details.credits?.crew);
  if (director) {
    bump(acc.directors, director.id, weight);
    remember(acc.directorNames, director.id, director.name);
  }
  for (const kw of details.keywords?.keywords ?? []) {
    bump(acc.keywords, kw.id, weight);
    remember(acc.keywordNames, kw.id, kw.name);
  }
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Build a `UserProfile` from raw signal sources.
 *
 * Algorithm:
 *  1. Walk every signal source, accumulating weighted contributions into per-
 *     entity Maps. Signal weights come from `SIGNAL_WEIGHTS`; ratings are
 *     normalized against the user's own average so a tough rater giving a 7
 *     still reads as positive.
 *  2. Track `seenMovieIds` and `dislikedMovieIds` for hard-filtering later.
 *  3. Normalize every weight map to [-1, 1].
 *  4. Decide cold-start vs. personalized via `COLD_START_THRESHOLD`.
 */
export function buildUserProfile(sources: UserSignalSources): UserProfile {
  const genres = new Map<number, number>();
  const actors = new Map<number, number>();
  const directors = new Map<number, number>();
  const keywords = new Map<number, number>();
  const genreNames = new Map<number, string>();
  const actorNames = new Map<number, string>();
  const directorNames = new Map<number, string>();
  const keywordNames = new Map<number, string>();
  const seenMovieIds = new Set<number>();
  const dislikedMovieIds = new Set<number>();

  const acc = {
    genres,
    actors,
    directors,
    keywords,
    genreNames,
    actorNames,
    directorNames,
    keywordNames,
  };

  let signalCount = 0;

  // --- Onboarding genres (cold-start seed) -----------------------------------
  for (const genreId of sources.onboardingGenres) {
    bump(genres, genreId, SIGNAL_WEIGHTS.onboarded_genre);
    signalCount += 1;
  }

  // --- Liked movies ----------------------------------------------------------
  for (const [id, details] of sources.liked) {
    seenMovieIds.add(id);
    applyMovieSignal(details, SIGNAL_WEIGHTS.liked, acc);
    signalCount += 1;
  }

  // --- Watchlisted movies (intent — softer positive signal) ------------------
  for (const [id, details] of sources.watchlist) {
    seenMovieIds.add(id);
    applyMovieSignal(details, SIGNAL_WEIGHTS.watchlisted, acc);
    signalCount += 1;
  }

  // --- Watched movies (engagement — softer than liked) -----------------------
  for (const [id, details] of sources.watched) {
    seenMovieIds.add(id);
    applyMovieSignal(details, SIGNAL_WEIGHTS.watched, acc);
    signalCount += 1;
  }

  // --- Disliked movies (hard filter + negative weight) -----------------------
  for (const [id, details] of sources.disliked) {
    seenMovieIds.add(id);
    dislikedMovieIds.add(id);
    applyMovieSignal(details, SIGNAL_WEIGHTS.disliked, acc);
    signalCount += 1;
  }

  // --- Explicit 0–10 ratings -------------------------------------------------
  // Compute the user's average first so we can normalize. Tough raters (avg 4)
  // giving a 7 should still register as positive.
  const ratings = Array.from(sources.ratings.values());
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 5; // neutral midpoint if no ratings yet

  for (const [id, { rating, details }] of sources.ratings) {
    seenMovieIds.add(id);
    // Normalize: (rating - avg) / 5 ∈ roughly [-1, 1].
    const normalized = (rating - averageRating) / 5;
    applyMovieSignal(details, normalized, acc);
    if (rating <= 3) dislikedMovieIds.add(id);
    signalCount += 1;
  }

  // --- Apply recency decay where we have timestamps --------------------------
  // (Currently a no-op because UserSignalSources doesn't carry timestamps per
  //  source map. If/when we promote the raw `UserSignal[]` into this builder
  //  we can call `recencyMultiplier(s.timestamp)` per signal.)
  void recencyMultiplier;

  // --- Normalize all weight maps to [-1, 1] ----------------------------------
  normalize(genres);
  normalize(actors);
  normalize(directors);
  normalize(keywords);

  return {
    genreWeights: genres,
    actorWeights: actors,
    directorWeights: directors,
    keywordWeights: keywords,
    actorNames,
    directorNames,
    keywordNames,
    genreNames,
    seenMovieIds,
    dislikedMovieIds,
    signalCount,
    isPersonalized: signalCount >= COLD_START_THRESHOLD,
    averageRating,
  };
}

/**
 * Empty profile used by SSR boundaries before the client hydrates the Zustand
 * store. Keeps the engine total-typed without `undefined` checks at every
 * call site.
 */
export function emptyUserProfile(): UserProfile {
  return {
    genreWeights: new Map(),
    actorWeights: new Map(),
    directorWeights: new Map(),
    keywordWeights: new Map(),
    actorNames: new Map(),
    directorNames: new Map(),
    keywordNames: new Map(),
    genreNames: new Map(),
    seenMovieIds: new Set(),
    dislikedMovieIds: new Set(),
    signalCount: 0,
    isPersonalized: false,
    averageRating: 5,
  };
}
