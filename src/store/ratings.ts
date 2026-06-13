/**
 * Ratings store — half-star ratings on a 0.5..10 scale.
 *
 * Rating signals carry the heaviest weight inside the recommendation engine
 * (`SIGNAL_WEIGHTS.rating`), so we keep the cached snapshot alongside the
 * value to power the "Your top-rated" row without re-fetching TMDB.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Movie } from "@/types/tmdb";
import type { RatingEntry, WatchlistItem } from "@/types/user";

import { currentProfileStorageKey, registerProfileScopedStore } from "./profile-scoped";
import { persistStorage } from "./storage";

interface RatingsState {
  items: RatingEntry[];

  setRating: (movie: Movie, rating: number) => void;
  removeRating: (movieId: number) => void;
  clear: () => void;

  get: (movieId: number) => RatingEntry | undefined;
  ratingFor: (movieId: number) => number | undefined;
  averageRating: () => number;
  count: () => number;
  topRated: (limit?: number) => RatingEntry[];
}

function snapshot(movie: Movie): WatchlistItem["movie"] {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    genre_ids: movie.genre_ids,
  };
}

/** Snap to the nearest 0.5 step and clamp to the [0.5, 10] range. */
function normalizeRating(value: number): number {
  const stepped = Math.round(value * 2) / 2;
  return Math.max(0.5, Math.min(10, stepped));
}

export const useRatingsStore = create<RatingsState>()(
  persist(
    (set, get) => ({
      items: [],

      setRating: (movie, rating) =>
        set((state) => {
          const normalized = normalizeRating(rating);
          const idx = state.items.findIndex((item) => item.movieId === movie.id);
          const entry: RatingEntry = {
            movieId: movie.id,
            movie: snapshot(movie),
            rating: normalized,
            ratedAt: new Date().toISOString(),
          };
          if (idx === -1) return { items: [entry, ...state.items] };
          const next = state.items.slice();
          next[idx] = entry;
          return { items: next };
        }),

      removeRating: (movieId) =>
        set((state) => ({
          items: state.items.filter((item) => item.movieId !== movieId),
        })),

      clear: () => set({ items: [] }),

      get: (movieId) => get().items.find((item) => item.movieId === movieId),
      ratingFor: (movieId) =>
        get().items.find((item) => item.movieId === movieId)?.rating,

      averageRating: () => {
        const items = get().items;
        if (items.length === 0) return 0;
        const sum = items.reduce((acc, item) => acc + item.rating, 0);
        return sum / items.length;
      },

      count: () => get().items.length,

      topRated: (limit = 10) =>
        get()
          .items.slice()
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            // Tiebreaker: most recently rated first so the row stays fresh.
            return Date.parse(b.ratedAt) - Date.parse(a.ratedAt);
          })
          .slice(0, limit),
    }),
    {
      name: currentProfileStorageKey("ratings"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

registerProfileScopedStore(useRatingsStore, "ratings");
