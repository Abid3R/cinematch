/**
 * TMDB service barrel.
 *
 * Consumers should import from `@/services/tmdb` rather than reaching into
 * individual modules — that way the underlying split is an implementation
 * detail we can refactor without churn at every call site.
 */

// Core client + error
export { tmdbGet, TmdbError, type TmdbRequestOptions } from "./client";

// Movies
export {
  getTrending,
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getMovieDetails,
  getSimilarMovies,
  getMovieRecommendations,
  type TrendingWindow,
} from "./movies";

// Discover
export { discoverMovies, discoverByGenre } from "./discover";

// Search
export {
  searchMovies,
  searchMulti,
  searchPeople,
  type SearchOptions,
  type MultiSearchResult,
  type PersonSearchResult,
} from "./search";

// People
export {
  getPersonDetails,
  getPersonMovieCredits,
  type PersonDetails,
  type PersonMovieCredits,
} from "./people";

// Genres
export { getMovieGenres, getGenreMap } from "./genres";
