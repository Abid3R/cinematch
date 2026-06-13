/**
 * TMDB API constants.
 *
 * Centralizes endpoint paths, image base URLs, image size presets, and the
 * default genre map used as a fallback when the live `/genre/movie/list` call
 * hasn't resolved yet.
 */

// -----------------------------------------------------------------------------
// API + image bases
// -----------------------------------------------------------------------------

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
export const YOUTUBE_THUMB_BASE_URL = "https://img.youtube.com/vi";

// -----------------------------------------------------------------------------
// Image size presets — TMDB exposes named sizes (w185, w500, original, ...).
// We narrow the surface to the ones we actually request from next/image.
// -----------------------------------------------------------------------------

export const POSTER_SIZES = {
  xs: "w92",
  sm: "w154",
  md: "w185",
  lg: "w342",
  xl: "w500",
  xxl: "w780",
  original: "original",
} as const;

export const BACKDROP_SIZES = {
  sm: "w300",
  md: "w780",
  lg: "w1280",
  original: "original",
} as const;

export const PROFILE_SIZES = {
  sm: "w45",
  md: "w185",
  lg: "h632",
  original: "original",
} as const;

export type PosterSize = keyof typeof POSTER_SIZES;
export type BackdropSize = keyof typeof BACKDROP_SIZES;
export type ProfileSize = keyof typeof PROFILE_SIZES;

// -----------------------------------------------------------------------------
// Endpoint paths — relative to TMDB_BASE_URL. Path params are documented inline.
// -----------------------------------------------------------------------------

export const TMDB_ENDPOINTS = {
  trending: "/trending/movie/week",
  trendingDay: "/trending/movie/day",
  popular: "/movie/popular",
  topRated: "/movie/top_rated",
  upcoming: "/movie/upcoming",
  nowPlaying: "/movie/now_playing",
  discover: "/discover/movie",
  search: "/search/movie",
  searchMulti: "/search/multi",
  searchPerson: "/search/person",
  movieDetails: (id: number) => `/movie/${id}`,
  movieCredits: (id: number) => `/movie/${id}/credits`,
  movieVideos: (id: number) => `/movie/${id}/videos`,
  movieKeywords: (id: number) => `/movie/${id}/keywords`,
  movieSimilar: (id: number) => `/movie/${id}/similar`,
  movieRecommendations: (id: number) => `/movie/${id}/recommendations`,
  movieReviews: (id: number) => `/movie/${id}/reviews`,
  personDetails: (id: number) => `/person/${id}`,
  personMovies: (id: number) => `/person/${id}/movie_credits`,
  genreList: "/genre/movie/list",
  configuration: "/configuration",
} as const;

// -----------------------------------------------------------------------------
// Default genre map — TMDB's canonical movie genres. Used as an immediate
// fallback so the UI can label `genre_ids` without waiting for the live list.
// Kept in sync with https://api.themoviedb.org/3/genre/movie/list
// -----------------------------------------------------------------------------

export const DEFAULT_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

// -----------------------------------------------------------------------------
// Cache + revalidation
// -----------------------------------------------------------------------------

/** Next.js `revalidate` (seconds) used for SSR fetches by endpoint kind. */
export const REVALIDATE = {
  trending: 60 * 60,        // 1 hour
  popular: 60 * 60 * 6,     // 6 hours
  topRated: 60 * 60 * 24,   // 1 day
  upcoming: 60 * 60 * 12,   // 12 hours
  details: 60 * 60 * 24,    // 1 day
  search: 60 * 5,           // 5 minutes
  genres: 60 * 60 * 24 * 7, // 1 week
} as const;

// -----------------------------------------------------------------------------
// Display
// -----------------------------------------------------------------------------

export const TMDB_ATTRIBUTION = "This product uses the TMDB API but is not endorsed or certified by TMDB.";
