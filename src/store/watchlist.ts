/**
 * Watchlist store — persistent "save for later" queue.
 *
 * Holds a cached, compact snapshot of each saved movie so the watchlist page
 * can render without re-fetching from TMDB. Add/remove/toggle/clear operations
 * are idempotent and produce a fresh array reference so React subscribers
 * re-render reliably.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Movie } from "@/types/tmdb";
import type { WatchlistItem } from "@/types/user";

import { currentProfileStorageKey, registerProfileScopedStore } from "./profile-scoped";
import { persistStorage } from "./storage";

interface WatchlistState {
  items: WatchlistItem[];

  add: (movie: Movie, note?: string) => void;
  remove: (movieId: number) => void;
  toggle: (movie: Movie) => void;
  setNote: (movieId: number, note: string | undefined) => void;
  clear: () => void;

  has: (movieId: number) => boolean;
  get: (movieId: number) => WatchlistItem | undefined;
  count: () => number;
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

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (movie, note) =>
        set((state) => {
          if (state.items.some((item) => item.movieId === movie.id)) return state;
          const next: WatchlistItem = {
            movieId: movie.id,
            movie: snapshot(movie),
            addedAt: new Date().toISOString(),
            note,
          };
          // Most-recent-first so the watchlist page reads chronologically.
          return { items: [next, ...state.items] };
        }),

      remove: (movieId) =>
        set((state) => ({
          items: state.items.filter((item) => item.movieId !== movieId),
        })),

      toggle: (movie) => {
        const exists = get().items.some((item) => item.movieId === movie.id);
        if (exists) get().remove(movie.id);
        else get().add(movie);
      },

      setNote: (movieId, note) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.movieId === movieId ? { ...item, note } : item,
          ),
        })),

      clear: () => set({ items: [] }),

      has: (movieId) => get().items.some((item) => item.movieId === movieId),
      get: (movieId) => get().items.find((item) => item.movieId === movieId),
      count: () => get().items.length,
    }),
    {
      name: currentProfileStorageKey("watchlist"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

registerProfileScopedStore(useWatchlistStore, "watchlist");
