/**
 * TMDB API type definitions.
 *
 * These mirror the shape of TMDB v3 responses for the endpoints CineMatch uses.
 * Only the fields we consume are typed; everything else is intentionally `unknown`
 * to keep the surface area tight.
 *
 * @see https://developer.themoviedb.org/reference/intro/getting-started
 */

// -----------------------------------------------------------------------------
// Shared primitives
// -----------------------------------------------------------------------------

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface SpokenLanguage {
  iso_639_1: string;
  english_name: string;
  name: string;
}

// -----------------------------------------------------------------------------
// Movie shapes
// -----------------------------------------------------------------------------

/**
 * Lightweight movie shape returned by list endpoints
 * (trending, popular, top_rated, upcoming, search, recommendations, ...).
 */
export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

/**
 * Full movie shape returned by /movie/{id}?append_to_response=...
 */
export interface MovieDetails extends Omit<Movie, "genre_ids"> {
  budget: number;
  revenue: number;
  runtime: number | null;
  status: string;
  tagline: string | null;
  homepage: string | null;
  imdb_id: string | null;
  genres: Genre[];
  production_companies: ProductionCompany[];
  spoken_languages: SpokenLanguage[];
  credits?: Credits;
  videos?: { results: Video[] };
  keywords?: { keywords: Keyword[] };
  similar?: PaginatedResponse<Movie>;
  recommendations?: PaginatedResponse<Movie>;
  reviews?: PaginatedResponse<Review>;
}

// -----------------------------------------------------------------------------
// Credits, cast, crew
// -----------------------------------------------------------------------------

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  popularity: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

// -----------------------------------------------------------------------------
// Videos, keywords, reviews
// -----------------------------------------------------------------------------

export interface Video {
  id: string;
  key: string;
  name: string;
  site: "YouTube" | "Vimeo" | string;
  size: number;
  type: "Trailer" | "Teaser" | "Clip" | "Featurette" | "Behind the Scenes" | string;
  official: boolean;
  published_at: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface Review {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  url: string;
}

// -----------------------------------------------------------------------------
// Pagination wrapper used by almost every list endpoint
// -----------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// -----------------------------------------------------------------------------
// Discover filter parameters
// -----------------------------------------------------------------------------

export type SortBy =
  | "popularity.desc"
  | "popularity.asc"
  | "vote_average.desc"
  | "vote_average.asc"
  | "release_date.desc"
  | "release_date.asc"
  | "revenue.desc"
  | "vote_count.desc";

export interface DiscoverFilters {
  page?: number;
  sort_by?: SortBy;
  with_genres?: string;        // comma-separated IDs
  without_genres?: string;
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "with_runtime.gte"?: number;
  "with_runtime.lte"?: number;
  with_original_language?: string;
  "vote_count.gte"?: number;
  include_adult?: boolean;
}
