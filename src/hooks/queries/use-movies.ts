/**
 * React Query hooks for TMDB movie endpoints.
 *
 * Thin wrappers around `@/services/tmdb` that:
 *  - Reuse the key factory in `./keys` so cache invalidation stays consistent.
 *  - Apply per-endpoint cache tuning (e.g. `staleTime: Infinity` for movie
 *    details — they essentially never change, so we don't want to hit the
 *    network on every revisit).
 *  - Expose strong return types so consumers don't need to re-cast.
 *
 * For infinite/paginated lists we expose two flavors:
 *  - `useXxx(page)` — a single page (used by widget rows that only need page 1).
 *  - `useXxxInfinite()` — `useInfiniteQuery` (used by Discover-style scrollers).
 */

"use client";

import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  getMovieDetails,
  getMovieRecommendations,
  getNowPlaying,
  getPopular,
  getSimilarMovies,
  getTopRated,
  getTrending,
  getUpcoming,
  type TrendingWindow,
} from "@/services/tmdb";
import type { Movie, MovieDetails, PaginatedResponse } from "@/types/tmdb";

import { queryKeys } from "./keys";

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

interface PageParams {
  page?: number;
  enabled?: boolean;
}

/** Compute the next page parameter for `useInfiniteQuery`. */
function nextPage(last: PaginatedResponse<Movie>): number | undefined {
  if (last.page >= last.total_pages) return undefined;
  return last.page + 1;
}

// -----------------------------------------------------------------------------
// Trending
// -----------------------------------------------------------------------------

export function useTrending(
  window: TrendingWindow = "week",
  { page = 1, enabled = true }: PageParams = {},
): UseQueryResult<PaginatedResponse<Movie>> {
  return useQuery({
    queryKey: [...queryKeys.movies.trending(window), page],
    queryFn: () => getTrending(window, page),
    staleTime: HOUR, // trending swings during the day
    enabled,
  });
}

export function useTrendingInfinite(
  window: TrendingWindow = "week",
): UseInfiniteQueryResult<{ pages: PaginatedResponse<Movie>[]; pageParams: number[] }> {
  return useInfiniteQuery({
    queryKey: queryKeys.movies.trending(window),
    queryFn: ({ pageParam = 1 }) => getTrending(window, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: HOUR,
  });
}

// -----------------------------------------------------------------------------
// Popular / Top Rated / Upcoming / Now Playing
// -----------------------------------------------------------------------------

export function usePopular({ page = 1, enabled = true }: PageParams = {}): UseQueryResult<
  PaginatedResponse<Movie>
> {
  return useQuery({
    queryKey: [...queryKeys.movies.popular(), page],
    queryFn: () => getPopular(page),
    enabled,
  });
}

export function usePopularInfinite() {
  return useInfiniteQuery({
    queryKey: queryKeys.movies.popular(),
    queryFn: ({ pageParam = 1 }) => getPopular(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useTopRated({ page = 1, enabled = true }: PageParams = {}): UseQueryResult<
  PaginatedResponse<Movie>
> {
  return useQuery({
    queryKey: [...queryKeys.movies.topRated(), page],
    queryFn: () => getTopRated(page),
    staleTime: DAY, // top-rated rarely changes
    enabled,
  });
}

export function useTopRatedInfinite() {
  return useInfiniteQuery({
    queryKey: queryKeys.movies.topRated(),
    queryFn: ({ pageParam = 1 }) => getTopRated(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: DAY,
  });
}

export function useUpcoming({ page = 1, enabled = true }: PageParams = {}): UseQueryResult<
  PaginatedResponse<Movie>
> {
  return useQuery({
    queryKey: [...queryKeys.movies.upcoming(), page],
    queryFn: () => getUpcoming(page),
    staleTime: 6 * HOUR,
    enabled,
  });
}

export function useNowPlaying({
  page = 1,
  enabled = true,
}: PageParams = {}): UseQueryResult<PaginatedResponse<Movie>> {
  return useQuery({
    queryKey: [...queryKeys.movies.nowPlaying(), page],
    queryFn: () => getNowPlaying(page),
    staleTime: 6 * HOUR,
    enabled,
  });
}

// -----------------------------------------------------------------------------
// Movie details + adjacencies
// -----------------------------------------------------------------------------

export function useMovieDetails(
  id: number | null | undefined,
): UseQueryResult<MovieDetails> {
  return useQuery({
    queryKey: queryKeys.movies.details(id ?? 0),
    queryFn: () => getMovieDetails(id as number),
    // Movie metadata is effectively immutable — cache aggressively.
    staleTime: 7 * DAY,
    gcTime: 14 * DAY,
    enabled: typeof id === "number" && id > 0,
  });
}

export function useSimilarMovies(
  id: number | null | undefined,
  { page = 1, enabled = true }: PageParams = {},
): UseQueryResult<PaginatedResponse<Movie>> {
  return useQuery({
    queryKey: [...queryKeys.movies.similar(id ?? 0), page],
    queryFn: () => getSimilarMovies(id as number, page),
    staleTime: DAY,
    enabled: enabled && typeof id === "number" && id > 0,
  });
}

export function useMovieTmdbRecommendations(
  id: number | null | undefined,
  { page = 1, enabled = true }: PageParams = {},
): UseQueryResult<PaginatedResponse<Movie>> {
  return useQuery({
    queryKey: [...queryKeys.movies.recommendations(id ?? 0), page],
    queryFn: () => getMovieRecommendations(id as number, page),
    staleTime: DAY,
    enabled: enabled && typeof id === "number" && id > 0,
  });
}
