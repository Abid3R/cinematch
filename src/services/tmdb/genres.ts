/**
 * TMDB genre endpoint.
 *
 * `/genre/movie/list` returns the canonical movie genre dictionary. We cache
 * it aggressively (1 week TTL) since the list barely changes, and fall back
 * to `DEFAULT_GENRE_MAP` if the request fails so the UI can still label
 * `genre_ids` without waiting on a live response.
 */

import {
  DEFAULT_GENRE_MAP,
  REVALIDATE,
  TMDB_ENDPOINTS,
} from "@/constants/tmdb";
import type { Genre } from "@/types/tmdb";

import { tmdbGet } from "./client";

// -----------------------------------------------------------------------------
// Internal
// -----------------------------------------------------------------------------

interface GenreListResponse {
  genres: Genre[];
}

/**
 * Synthesize a `Genre[]` from the static `DEFAULT_GENRE_MAP`. Used as the
 * fallback when the live request fails or before the data cache is warm.
 */
function defaultGenres(): Genre[] {
  return Object.entries(DEFAULT_GENRE_MAP).map(([id, name]) => ({
    id: Number(id),
    name,
  }));
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Fetch the canonical TMDB movie genre list.
 *
 * Resilient by design: any failure (network, 4xx, 5xx after retries) returns
 * the bundled `DEFAULT_GENRE_MAP` so the UI never sees an empty filter panel.
 */
export async function getMovieGenres(): Promise<Genre[]> {
  try {
    const response = await tmdbGet<GenreListResponse>(
      TMDB_ENDPOINTS.genreList,
      {
        revalidate: REVALIDATE.genres,
        tags: ["tmdb:genres"],
      },
    );
    if (!response?.genres?.length) {
      return defaultGenres();
    }
    return response.genres;
  } catch {
    return defaultGenres();
  }
}

/**
 * Returns a lookup table `{ [id]: name }` for fast genre labeling. Falls back
 * to `DEFAULT_GENRE_MAP` shape on failure.
 */
export async function getGenreMap(): Promise<Record<number, string>> {
  const genres = await getMovieGenres();
  return genres.reduce<Record<number, string>>((acc, genre) => {
    acc[genre.id] = genre.name;
    return acc;
  }, {});
}
