/**
 * TMDB search endpoints.
 *
 * Three flavors:
 *  - `searchMovies`   — movies-only (used by the dedicated search page).
 *  - `searchMulti`    — movies + tv + people in a single ranked feed (command
 *                       palette / global search).
 *  - `searchPeople`   — people-only (cast/crew autocomplete).
 *
 * Search responses change frequently, so we use a short revalidate window and
 * expose an `instant` flag that bypasses the data cache entirely — ideal for
 * keystroke-by-keystroke autocomplete where stale cache hits are visible to
 * the user.
 */

import { REVALIDATE, TMDB_ENDPOINTS } from "@/constants/tmdb";
import type { Movie, PaginatedResponse } from "@/types/tmdb";

import { tmdbGet } from "./client";

// -----------------------------------------------------------------------------
// Multi-search result shape (movies + tv + people)
// -----------------------------------------------------------------------------

/**
 * `multi` returns a heterogeneous result list discriminated by `media_type`.
 * We only model the fields the UI actually renders.
 */
export type MultiSearchResult =
  | (Movie & { media_type: "movie" })
  | {
      media_type: "tv";
      id: number;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string | null;
      backdrop_path: string | null;
      first_air_date: string;
      vote_average: number;
      vote_count: number;
      popularity: number;
      genre_ids: number[];
    }
  | {
      media_type: "person";
      id: number;
      name: string;
      profile_path: string | null;
      popularity: number;
      known_for_department: string;
      known_for: Array<Movie & { media_type: "movie" }>;
    };

export interface PersonSearchResult {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
  known_for: Array<Movie & { media_type: "movie" | "tv" }>;
}

// -----------------------------------------------------------------------------
// Search options
// -----------------------------------------------------------------------------

export interface SearchOptions {
  page?: number;
  /**
   * Bypass the data cache for live autocomplete. Defaults to `false` (cached
   * with a 5-minute TTL) — flip to `true` for command-palette typing.
   */
  instant?: boolean;
  /** Whether to include adult-rated results. */
  include_adult?: boolean;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function buildSearchInit(
  query: string,
  options: SearchOptions,
): {
  params: Record<string, string | number | boolean>;
  revalidate?: number;
  cache?: RequestCache;
  tags?: string[];
} {
  const params: Record<string, string | number | boolean> = {
    query,
    page: options.page ?? 1,
    include_adult: options.include_adult ?? false,
  };
  if (options.instant) {
    return { params, cache: "no-store" };
  }
  return {
    params,
    revalidate: REVALIDATE.search,
    tags: ["tmdb:search"],
  };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Movies-only search. Empty queries short-circuit to an empty page so callers
 * (e.g. controlled inputs that debounce) don't fire a useless request.
 */
export function searchMovies(
  query: string,
  options: SearchOptions = {},
): Promise<PaginatedResponse<Movie>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return Promise.resolve(emptyPage<Movie>());
  }
  const init = buildSearchInit(trimmed, options);
  return tmdbGet<PaginatedResponse<Movie>>(TMDB_ENDPOINTS.search, init);
}

/**
 * Cross-media search (movies + tv + people). Used by the command palette where
 * the user can land on any of the three result types.
 */
export function searchMulti(
  query: string,
  options: SearchOptions = {},
): Promise<PaginatedResponse<MultiSearchResult>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return Promise.resolve(emptyPage<MultiSearchResult>());
  }
  const init = buildSearchInit(trimmed, options);
  return tmdbGet<PaginatedResponse<MultiSearchResult>>(
    TMDB_ENDPOINTS.searchMulti,
    init,
  );
}

/**
 * People-only search. Powers cast/crew autocomplete on the discover filters.
 */
export function searchPeople(
  query: string,
  options: SearchOptions = {},
): Promise<PaginatedResponse<PersonSearchResult>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return Promise.resolve(emptyPage<PersonSearchResult>());
  }
  const init = buildSearchInit(trimmed, options);
  return tmdbGet<PaginatedResponse<PersonSearchResult>>(
    TMDB_ENDPOINTS.searchPerson,
    init,
  );
}

// -----------------------------------------------------------------------------
// Internal
// -----------------------------------------------------------------------------

function emptyPage<T>(): PaginatedResponse<T> {
  return { page: 1, results: [], total_pages: 0, total_results: 0 };
}
