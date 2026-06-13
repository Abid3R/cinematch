/**
 * Search hooks — debounced TMDB search bindings.
 *
 * Every hook shares the same skeleton:
 *  1. Debounce the query string (caller passes raw input — no need to debounce
 *     at the call site).
 *  2. Only fire when the trimmed query has 2+ characters (one-letter results
 *     are noise and chew through the TMDB quota).
 *  3. `placeholderData: keepPreviousData` so the row doesn't flash empty while
 *     typing.
 *
 * `instant: true` is exposed for the command palette, which has its own
 * latency budget and bypasses the per-request HTTP cache.
 */

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  searchMovies,
  searchMulti,
  searchPeople,
  type MultiSearchResult,
  type PersonSearchResult,
  type SearchOptions,
} from "@/services/tmdb";
import type { Movie, PaginatedResponse } from "@/types/tmdb";

import { useDebouncedValue } from "./use-debounced-value";
import { queryKeys } from "./keys";

interface UseSearchOptions extends Omit<SearchOptions, "page"> {
  /** Override the debounce window. Defaults to 300ms. */
  debounceMs?: number;
  /** Disable the query (e.g. when the search panel is closed). */
  enabled?: boolean;
  /** Page to fetch — useful for paginated search results pages. */
  page?: number;
  /** Minimum length before firing. Defaults to 2. */
  minLength?: number;
}

function shouldRun(query: string, minLength: number, enabled: boolean): boolean {
  return enabled && query.trim().length >= minLength;
}

// -----------------------------------------------------------------------------
// Movies
// -----------------------------------------------------------------------------

export function useSearchMovies(
  rawQuery: string,
  {
    debounceMs = 300,
    enabled = true,
    page = 1,
    minLength = 2,
    instant,
    include_adult,
  }: UseSearchOptions = {},
) {
  const query = useDebouncedValue(rawQuery, debounceMs);
  const trimmed = query.trim();

  return useQuery<PaginatedResponse<Movie>>({
    queryKey: [...queryKeys.search.movies(trimmed), page, !!instant],
    queryFn: () => searchMovies(trimmed, { page, instant, include_adult }),
    enabled: shouldRun(trimmed, minLength, enabled),
    placeholderData: keepPreviousData,
    staleTime: 30_000, // search results aren't worth recaching aggressively
  });
}

// -----------------------------------------------------------------------------
// Multi (movies + tv + people) — powers the command palette
// -----------------------------------------------------------------------------

export function useSearchMulti(
  rawQuery: string,
  {
    debounceMs = 200,
    enabled = true,
    page = 1,
    minLength = 2,
    instant = true,
    include_adult,
  }: UseSearchOptions = {},
) {
  const query = useDebouncedValue(rawQuery, debounceMs);
  const trimmed = query.trim();

  return useQuery<PaginatedResponse<MultiSearchResult>>({
    queryKey: [...queryKeys.search.multi(trimmed), page, instant],
    queryFn: () => searchMulti(trimmed, { page, instant, include_adult }),
    enabled: shouldRun(trimmed, minLength, enabled),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

// -----------------------------------------------------------------------------
// People
// -----------------------------------------------------------------------------

export function useSearchPeople(
  rawQuery: string,
  {
    debounceMs = 300,
    enabled = true,
    page = 1,
    minLength = 2,
    instant,
    include_adult,
  }: UseSearchOptions = {},
) {
  const query = useDebouncedValue(rawQuery, debounceMs);
  const trimmed = query.trim();

  return useQuery<PaginatedResponse<PersonSearchResult>>({
    queryKey: [...queryKeys.search.people(trimmed), page, !!instant],
    queryFn: () => searchPeople(trimmed, { page, instant, include_adult }),
    enabled: shouldRun(trimmed, minLength, enabled),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
