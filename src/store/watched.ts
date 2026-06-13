/**
 * Watched store — movies the user has finished.
 *
 * Distinct from the watchlist (which is "save for later"). The watched list
 * acts as a personal viewing log shown on the profile page and also feeds the
 * recommendation engine as a positive signal (you tend to enjoy similar films
 * to ones you actually finished).
 *
 * Marking a movie watched is idempotent — re-marking refreshes the timestamp
 * but doesn't create a duplicate entry. By convention, marking watched does
 * not automatically remove the movie from the watchlist; that's left to the UI
 * to decide based on user intent.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Movie } from "@/types/tmdb";
import type { WatchedEntry, WatchlistItem } from "@/types/user";

import { currentProfileStorageKey, registerProfileScopedStore } from "./profile-scoped";
import { persistStorage } from "./storage";

interface WatchedState {
  items: WatchedEntry[];

  mark: (movie: Movie) => void;
  unmark: (movieId: number) => void;
  toggle: (movie: Movie) => void;
  clear: () => void;

  has: (movieId: number) => boolean;
  get: (movieId: number) => WatchedEntry | undefined;
  count: () => number;
  recent: (limit?: number) => WatchedEntry[];
  ids: () => Set<number>;
}

/** Project a full TMDB Movie down to the persisted snapshot shape. */
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

export const useWatchedStore = create<WatchedState>()(
  persist(
    (set, get) => ({
      items: [],

      mark: (movie) =>
        set((state) => {
          const now = new Date().toISOString();
          const idx = state.items.findIndex((item) => item.movieId === movie.id);
          const entry: WatchedEntry = {
            movieId: movie.id,
            movie: snapshot(movie),
            watchedAt: now,
          };
          // Most-recent-first so the profile page reads chronologically.
          if (idx === -1) return { items: [entry, ...state.items] };
          const next = state.items.slice();
          next.splice(idx, 1);
          return { items: [entry, ...next] };
        }),

      unmark: (movieId) =>
        set((state) => ({
          items: state.items.filter((item) => item.movieId !== movieId),
        })),

      toggle: (movie) => {
        if (get().has(movie.id)) get().unmark(movie.id);
        else get().mark(movie);
      },

      clear: () => set({ items: [] }),

      has: (movieId) => get().items.some((item) => item.movieId === movieId),
      get: (movieId) => get().items.find((item) => item.movieId === movieId),
      count: () => get().items.length,
      recent: (limit = 12) => get().items.slice(0, limit),
      ids: () => new Set(get().items.map((item) => item.movieId)),
    }),
    {
      name: currentProfileStorageKey("watched"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

registerProfileScopedStore(useWatchedStore, "watched");
