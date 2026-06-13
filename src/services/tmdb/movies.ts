/**
 * TMDB movie endpoints.
 *
 * Typed wrappers around the most-used `/movie/*` and `/trending/*` endpoints.
 * Every call routes through `tmdbGet` so retries, caching, and error shape are
 * uniform — these modules only declare the path, params, and TTL.
 */

import { REVALIDATE, TMDB_ENDPOINTS } from "@/constants/tmdb";
import type {
  Movie,
  MovieDetails,
  PaginatedResponse,
} from "@/types/tmdb";

import { tmdbGet } from "./client";

// -----------------------------------------------------------------------------
// Discovery feeds (homepage rails)
// -----------------------------------------------------------------------------

export type TrendingWindow = "day" | "week";

/**
 * Trending movies — weekly window by default for a more stable rail. The daily
 * window is exposed for the "trending right now" hero strip.
 */
export function getTrending(
  window: TrendingWindow = "week",
  page = 1,
): Promise<PaginatedResponse<Movie>> {
  const endpoint =
    window === "day" ? TMDB_ENDPOINTS.trendingDay : TMDB_ENDPOINTS.trending;
  return tmdbGet<PaginatedResponse<Movie>>(endpoint, {
    params: { page },
    revalidate: REVALIDATE.trending,
    tags: ["tmdb:trending", `tmdb:trending:${window}`],
  });
}

export function getPopular(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbGet<PaginatedResponse<Movie>>(TMDB_ENDPOINTS.popular, {
    params: { page },
    revalidate: REVALIDATE.popular,
    tags: ["tmdb:popular"],
  });
}

export function getTopRated(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbGet<PaginatedResponse<Movie>>(TMDB_ENDPOINTS.topRated, {
    params: { page },
    revalidate: REVALIDATE.topRated,
    tags: ["tmdb:top-rated"],
  });
}

export function getUpcoming(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbGet<PaginatedResponse<Movie>>(TMDB_ENDPOINTS.upcoming, {
    params: { page },
    revalidate: REVALIDATE.upcoming,
    tags: ["tmdb:upcoming"],
  });
}

export function getNowPlaying(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbGet<PaginatedResponse<Movie>>(TMDB_ENDPOINTS.nowPlaying, {
    params: { page },
    revalidate: REVALIDATE.upcoming,
    tags: ["tmdb:now-playing"],
  });
}

// -----------------------------------------------------------------------------
// Single movie
// -----------------------------------------------------------------------------

/**
 * Fetch full movie details with one round-trip.
 *
 * `append_to_response` is the TMDB-native way to bundle sub-resources
 * (credits, videos, keywords, similar, recommendations, reviews) into the
 * same payload — far cheaper than 6 sequential requests and keeps the cache
 * key consolidated.
 */
export function getMovieDetails(id: number): Promise<MovieDetails> {
  return tmdbGet<MovieDetails>(TMDB_ENDPOINTS.movieDetails(id), {
    params: {
      append_to_response:
        "credits,videos,keywords,similar,recommendations,reviews",
    },
    revalidate: REVALIDATE.details,
    tags: ["tmdb:movie", `tmdb:movie:${id}`],
  });
}

export function getSimilarMovies(
  id: number,
  page = 1,
): Promise<PaginatedResponse<Movie>> {
  return tmdbGet<PaginatedResponse<Movie>>(TMDB_ENDPOINTS.movieSimilar(id), {
    params: { page },
    revalidate: REVALIDATE.details,
    tags: [`tmdb:movie:${id}:similar`],
  });
}

export function getMovieRecommendations(
  id: number,
  page = 1,
): Promise<PaginatedResponse<Movie>> {
  return tmdbGet<PaginatedResponse<Movie>>(
    TMDB_ENDPOINTS.movieRecommendations(id),
    {
      params: { page },
      revalidate: REVALIDATE.details,
      tags: [`tmdb:movie:${id}:recommendations`],
    },
  );
}
