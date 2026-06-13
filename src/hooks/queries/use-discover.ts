/**
 * Discover hooks — filtered movie browsing with infinite scroll.
 *
 * The Discover page composes a `DiscoverFilters` object from the UI controls
 * and feeds it straight into `useDiscoverInfinite`. We strip the `page` field
 * from the cache key (it's the page param, not part of the filter identity)
 * so toggling filters cleanly forks the cache while pagination reuses it.
 */

"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { discoverByGenre, discoverMovies } from "@/services/tmdb";
import type { DiscoverFilters, Movie, PaginatedResponse } from "@/types/tmdb";

import { queryKeys } from "./keys";

function nextPage(last: PaginatedResponse<Movie>): number | undefined {
  if (last.page >= last.total_pages) return undefined;
  // TMDB's discover endpoint caps at 500 pages.
  if (last.page >= 500) return undefined;
  return last.page + 1;
}

function withoutPage(
  filters: DiscoverFilters,
): Omit<DiscoverFilters, "page"> {
  const { page: _page, ...rest } = filters;
  void _page;
  return rest;
}

/**
 * Infinite discover query. Pass any filter combination; page is supplied by
 * React Query through `pageParam`.
 */
export function useDiscoverInfinite(filters: DiscoverFilters = {}) {
  const filterKey = withoutPage(filters);

  return useInfiniteQuery({
    queryKey: queryKeys.discover.filter(filterKey),
    queryFn: ({ pageParam = 1 }) =>
      discoverMovies({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    // Discover queries are user-driven, so respect the global staleTime.
  });
}

/** Single-page discover, useful when you only need a small slice. */
export function useDiscover(filters: DiscoverFilters = {}) {
  const filterKey = withoutPage(filters);
  return useQuery({
    queryKey: [...queryKeys.discover.filter(filterKey), filters.page ?? 1],
    queryFn: () => discoverMovies(filters),
  });
}

/** Convenience: a single genre's first page. */
export function useGenreShowcase(
  genreId: number | null | undefined,
  page = 1,
) {
  return useQuery({
    queryKey: [...queryKeys.discover.byGenre(genreId ?? 0), page],
    queryFn: () => discoverByGenre(genreId as number, page),
    enabled: typeof genreId === "number" && genreId > 0,
  });
}
