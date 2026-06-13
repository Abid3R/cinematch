/**
 * Query key factory.
 *
 * Every React Query call in CineMatch derives its key from this file. Centralizing
 * the keys gives us:
 *  - Predictable invalidation (e.g. `queryClient.invalidateQueries({ queryKey: keys.movies.all })`).
 *  - Type-safe lookups — wrong arity to a key factory becomes a compile error.
 *  - One canonical place to align cache tags with TMDB's fetch revalidation.
 *
 * Convention: keys are arrays. The first element is always the namespace
 * (`"tmdb"` or `"reco"`) so we never collide with future top-level slices.
 */

import type { DiscoverFilters } from "@/types/tmdb";

import type { TrendingWindow } from "@/services/tmdb";

const TMDB = "tmdb" as const;
const RECO = "reco" as const;

export const queryKeys = {
  // ---------------------------------------------------------------------------
  // TMDB lists & details
  // ---------------------------------------------------------------------------
  movies: {
    all: [TMDB, "movies"] as const,
    trending: (window: TrendingWindow) =>
      [TMDB, "movies", "trending", window] as const,
    popular: () => [TMDB, "movies", "popular"] as const,
    topRated: () => [TMDB, "movies", "top-rated"] as const,
    upcoming: () => [TMDB, "movies", "upcoming"] as const,
    nowPlaying: () => [TMDB, "movies", "now-playing"] as const,
    details: (id: number) => [TMDB, "movies", "details", id] as const,
    similar: (id: number) => [TMDB, "movies", "similar", id] as const,
    recommendations: (id: number) =>
      [TMDB, "movies", "tmdb-recommendations", id] as const,
  },

  // ---------------------------------------------------------------------------
  // Discover (filtered + infinite)
  // ---------------------------------------------------------------------------
  discover: {
    all: [TMDB, "discover"] as const,
    filter: (filters: Omit<DiscoverFilters, "page">) =>
      [TMDB, "discover", filters] as const,
    byGenre: (genreId: number) => [TMDB, "discover", "by-genre", genreId] as const,
  },

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  search: {
    all: [TMDB, "search"] as const,
    movies: (query: string) =>
      [TMDB, "search", "movies", query.toLowerCase().trim()] as const,
    multi: (query: string) =>
      [TMDB, "search", "multi", query.toLowerCase().trim()] as const,
    people: (query: string) =>
      [TMDB, "search", "people", query.toLowerCase().trim()] as const,
  },

  // ---------------------------------------------------------------------------
  // People
  // ---------------------------------------------------------------------------
  people: {
    all: [TMDB, "people"] as const,
    details: (id: number) => [TMDB, "people", "details", id] as const,
    credits: (id: number) => [TMDB, "people", "credits", id] as const,
  },

  // ---------------------------------------------------------------------------
  // Genres
  // ---------------------------------------------------------------------------
  genres: {
    all: [TMDB, "genres"] as const,
    list: () => [TMDB, "genres", "list"] as const,
    map: () => [TMDB, "genres", "map"] as const,
  },

  // ---------------------------------------------------------------------------
  // Recommendation engine (derived; signal-count is part of the key so a new
  // like/rating/etc. naturally bumps the cache to a fresh entry).
  // ---------------------------------------------------------------------------
  reco: {
    all: [RECO] as const,
    /** Signal-source map (full detail snapshot for interacted ids). */
    sources: (signalCount: number) => [RECO, "sources", signalCount] as const,
    /** Final personalized recommendations. */
    personalized: (signalCount: number, poolSize: number) =>
      [RECO, "personalized", signalCount, poolSize] as const,
    /** Hidden-gem ranking on top of the candidate pool. */
    hiddenGems: (signalCount: number, poolSize: number) =>
      [RECO, "hidden-gems", signalCount, poolSize] as const,
    /** Similar ranking for a single anchor movie. */
    similarRanked: (movieId: number, signalCount: number) =>
      [RECO, "similar-ranked", movieId, signalCount] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
