/**
 * Signals selector — derive the engine's `UserSignal[]` stream from stores.
 *
 * The recommendation engine ultimately consumes `UserSignalSources` (a map of
 * movie ids → cached details). This module produces the lighter-weight
 * `UserSignal[]` projection that's useful for:
 *  - Analytics ("how many signals does this user have?")
 *  - The cold-start gate in `buildUserProfile`
 *  - Debugging the engine via the dev-only "explain" panel
 *
 * The selector is a pure function so it can be memoized at the React Query
 * layer without re-deriving on every render.
 */

import type { UserSignal } from "@/services/recommendation/types";

import { useLikesStore } from "./likes";
import { useOnboardingStore } from "./onboarding";
import { useRatingsStore } from "./ratings";
import { useSearchHistoryStore } from "./search-history";
import { useViewHistoryStore } from "./view-history";
import { useWatchlistStore } from "./watchlist";

/**
 * Snapshot the current store state into a flat list of signals, sorted most
 * recent first. The result is deterministic for a given store state, making
 * it safe to feed into React Query's stable keys.
 */
export function collectUserSignals(): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const like of useLikesStore.getState().items) {
    signals.push({
      type: like.state, // "liked" | "disliked"
      movieId: like.movieId,
      timestamp: like.updatedAt,
    });
  }

  for (const watch of useWatchlistStore.getState().items) {
    signals.push({
      type: "watchlisted",
      movieId: watch.movieId,
      timestamp: watch.addedAt,
    });
  }

  for (const view of useViewHistoryStore.getState().items) {
    signals.push({
      type: "watched",
      movieId: view.movieId,
      timestamp: view.viewedAt,
    });
  }

  for (const rating of useRatingsStore.getState().items) {
    signals.push({
      type: "rated",
      movieId: rating.movieId,
      rating: rating.rating,
      timestamp: rating.ratedAt,
    });
  }

  // Onboarding genres: emit one signal per selected genre. We don't have a
  // per-genre timestamp so they all share the most recent completion time
  // (or "now" if the user is mid-flow).
  const onboarding = useOnboardingStore.getState();
  if (onboarding.genreIds.length > 0) {
    const ts = new Date().toISOString();
    for (const genreId of onboarding.genreIds) {
      signals.push({ type: "onboarded_genre", genreId, timestamp: ts });
    }
  }

  // Search-click signals are surfaced via the search history queries that
  // resulted in TMDB hits (the recorder only stores executed queries).
  for (const search of useSearchHistoryStore.getState().items) {
    if (search.hits === 0) continue;
    signals.push({
      type: "search_clicked",
      timestamp: search.searchedAt,
    });
  }

  signals.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return signals;
}

/** Total number of personalization signals. Useful for cold-start branching. */
export function signalCount(): number {
  return (
    useLikesStore.getState().items.length +
    useWatchlistStore.getState().items.length +
    useViewHistoryStore.getState().items.length +
    useRatingsStore.getState().items.length +
    useOnboardingStore.getState().genreIds.length
  );
}
