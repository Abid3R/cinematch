/**
 * User data type definitions.
 *
 * These types describe everything CineMatch persists about the user locally
 * (watchlist, likes, ratings, search history, recently viewed). All state is
 * client-side and managed through Zustand stores with `persist` middleware.
 */

import type { Movie } from "./tmdb";

// -----------------------------------------------------------------------------
// Watchlist
// -----------------------------------------------------------------------------

export interface WatchlistItem {
  movieId: number;
  /** Cached snapshot so the watchlist can render without re-fetching. */
  movie: Pick<
    Movie,
    "id" | "title" | "poster_path" | "backdrop_path" | "release_date" | "vote_average" | "genre_ids"
  >;
  /** ISO timestamp the user added the movie. */
  addedAt: string;
  /** Optional user note (e.g. "Watch with friends"). */
  note?: string;
}

// -----------------------------------------------------------------------------
// Likes / dislikes
// -----------------------------------------------------------------------------

export type LikeState = "liked" | "disliked";

export interface LikedMovie {
  movieId: number;
  movie: WatchlistItem["movie"];
  state: LikeState;
  /** ISO timestamp. */
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Ratings (1..10, in half-star steps)
// -----------------------------------------------------------------------------

export interface RatingEntry {
  movieId: number;
  movie: WatchlistItem["movie"];
  /** Rating value in the range [0.5, 10] in 0.5 increments. */
  rating: number;
  /** ISO timestamp. */
  ratedAt: string;
}

// -----------------------------------------------------------------------------
// Search history
// -----------------------------------------------------------------------------

export interface SearchHistoryEntry {
  query: string;
  /** ISO timestamp. */
  searchedAt: string;
  /** How many times this exact query has been issued. */
  hits: number;
}

// -----------------------------------------------------------------------------
// Recently viewed
// -----------------------------------------------------------------------------

export interface ViewHistoryEntry {
  movieId: number;
  movie: WatchlistItem["movie"];
  /** ISO timestamp of the most recent view. */
  viewedAt: string;
  /** Total number of times the user has opened this movie's detail page. */
  views: number;
}

// -----------------------------------------------------------------------------
// Onboarding selections — captured during the cold-start flow
// -----------------------------------------------------------------------------

export interface OnboardingSelections {
  /** TMDB genre ids the user picked as favorites. */
  genreIds: number[];
  /** TMDB movie ids the user picked as favorites. */
  movieIds: number[];
  /** TMDB person ids the user picked as favorite actors. */
  actorIds: number[];
  /** TMDB person ids the user picked as favorite directors. */
  directorIds: number[];
  /** Whether the user has finished onboarding at least once. */
  completed: boolean;
}

// -----------------------------------------------------------------------------
// Watched (finished) movies — separate from the "save for later" watchlist
// -----------------------------------------------------------------------------

export interface WatchedEntry {
  movieId: number;
  movie: WatchlistItem["movie"];
  /** ISO timestamp the movie was marked watched. */
  watchedAt: string;
}

// -----------------------------------------------------------------------------
// Profiles — multiple users sharing the same browser
// -----------------------------------------------------------------------------

export interface Profile {
  /** Stable id used as the localStorage namespace for this profile. */
  id: string;
  /** Display name. */
  name: string;
  /** Single emoji used as an avatar. */
  emoji: string;
  /** ISO timestamp the profile was created. */
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Theme
// -----------------------------------------------------------------------------

export type ThemeMode = "dark" | "light" | "system";
