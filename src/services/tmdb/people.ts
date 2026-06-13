/**
 * TMDB person endpoints.
 *
 * Person types are colocated here (rather than in `@/types/tmdb`) because they
 * are only consumed by this module and the components that render person
 * details. Keeping them next to the fetchers makes the API surface easier to
 * reason about and avoids inflating the global type module.
 */

import { REVALIDATE, TMDB_ENDPOINTS } from "@/constants/tmdb";
import type { Movie } from "@/types/tmdb";

import { tmdbGet } from "./client";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Full person detail payload returned by `/person/{id}`.
 * Only the fields the UI actually renders are modeled.
 */
export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  also_known_as: string[];
  homepage: string | null;
  imdb_id: string | null;
  gender: 0 | 1 | 2 | 3;
}

/**
 * `/person/{id}/movie_credits` returns two parallel arrays — one for acting
 * credits and one for behind-the-camera credits.
 */
export interface PersonMovieCredits {
  id: number;
  cast: Array<
    Movie & {
      character: string;
      credit_id: string;
      order: number;
    }
  >;
  crew: Array<
    Movie & {
      department: string;
      job: string;
      credit_id: string;
    }
  >;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Fetch a person's biographical details. Cached with the details TTL since
 * biographies and birthdays effectively don't change after publish.
 */
export function getPersonDetails(id: number): Promise<PersonDetails> {
  return tmdbGet<PersonDetails>(TMDB_ENDPOINTS.personDetails(id), {
    revalidate: REVALIDATE.details,
    tags: ["tmdb:person", `tmdb:person:${id}`],
  });
}

/**
 * Fetch a person's full filmography. Used on the person detail page to render
 * cast and crew tabs.
 */
export function getPersonMovieCredits(id: number): Promise<PersonMovieCredits> {
  return tmdbGet<PersonMovieCredits>(TMDB_ENDPOINTS.personMovies(id), {
    revalidate: REVALIDATE.details,
    tags: [`tmdb:person:${id}:movies`],
  });
}
