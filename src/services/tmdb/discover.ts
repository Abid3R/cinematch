/**
 * TMDB discover endpoint.
 *
 * `/discover/movie` is the workhorse behind the Discover page — it lets users
 * combine genre, year, rating, runtime, and language filters with a sort order.
 * `DiscoverFilters` mirrors TMDB's native parameter names verbatim (including
 * dot-notation keys like `primary_release_date.gte`) so we can spread the
 * filter object straight into `tmdbGet` params without any key transformation.
 */

import { REVALIDATE, TMDB_ENDPOINTS } from "@/constants/tmdb";
import type {
  DiscoverFilters,
  Movie,
  PaginatedResponse,
  SortBy,
} from "@/types/tmdb";

import { tmdbGet, type TmdbRequestOptions } from "./client";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * TMDB's discover params accept primitives (string | number | boolean). We
 * strip `undefined` values so the cache key isn't polluted with empty entries,
 * and we coerce the few non-primitive shapes (none today, but kept for future).
 */
function buildDiscoverParams(
  filters: DiscoverFilters,
): TmdbRequestOptions["params"] {
  const params: TmdbRequestOptions["params"] = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params[key] = value as string | number | boolean;
  }
  return params;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Run a TMDB discover query.
 *
 * Defaults to `popularity.desc` and `include_adult=false` so a caller can pass
 * a partial filter object and still get a sensible feed. Caching uses the
 * popular-feed TTL since these results are stable for hours at a time.
 */
export function discoverMovies(
  filters: DiscoverFilters = {},
): Promise<PaginatedResponse<Movie>> {
  const merged: DiscoverFilters = {
    sort_by: "popularity.desc" satisfies SortBy,
    include_adult: false,
    ...filters,
  };

  return tmdbGet<PaginatedResponse<Movie>>(TMDB_ENDPOINTS.discover, {
    params: buildDiscoverParams(merged),
    revalidate: REVALIDATE.popular,
    tags: ["tmdb:discover"],
  });
}

/**
 * Convenience helper for "movies in this genre" rails on the home page.
 * Accepts a single TMDB genre ID and a page number.
 */
export function discoverByGenre(
  genreId: number,
  page = 1,
): Promise<PaginatedResponse<Movie>> {
  return discoverMovies({
    with_genres: String(genreId),
    page,
    sort_by: "popularity.desc",
  });
}
