/**
 * View history store — recently visited movie detail pages.
 *
 * Feeds the "Continue browsing" row on the home page and the analytics
 * dashboard's "Most-revisited" widget. Each view also functions as an
 * implicit interest signal inside the recommendation engine.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Movie } from "@/types/tmdb";
import type { ViewHistoryEntry, WatchlistItem } from "@/types/user";

import { currentProfileStorageKey, registerProfileScopedStore } from "./profile-scoped";
import { persistStorage } from "./storage";

/** Hard cap on retained entries — older views are evicted. */
const MAX_ENTRIES = 100;

interface ViewHistoryState {
  items: ViewHistoryEntry[];

  record: (movie: Movie) => void;
  remove: (movieId: number) => void;
  clear: () => void;

  recent: (limit?: number) => ViewHistoryEntry[];
  mostViewed: (limit?: number) => ViewHistoryEntry[];
  count: () => number;
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

export const useViewHistoryStore = create<ViewHistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      record: (movie) =>
        set((state) => {
          const now = new Date().toISOString();
          const existing = state.items.find((item) => item.movieId === movie.id);

          if (existing) {
            const rest = state.items.filter((item) => item.movieId !== movie.id);
            return {
              items: [
                {
                  ...existing,
                  movie: snapshot(movie),
                  viewedAt: now,
                  views: existing.views + 1,
                },
                ...rest,
              ],
            };
          }

          const next: ViewHistoryEntry = {
            movieId: movie.id,
            movie: snapshot(movie),
            viewedAt: now,
            views: 1,
          };
          return { items: [next, ...state.items].slice(0, MAX_ENTRIES) };
        }),

      remove: (movieId) =>
        set((state) => ({
          items: state.items.filter((item) => item.movieId !== movieId),
        })),

      clear: () => set({ items: [] }),

      recent: (limit = 12) => get().items.slice(0, limit),

      mostViewed: (limit = 10) =>
        get()
          .items.slice()
          .sort((a, b) => {
            if (b.views !== a.views) return b.views - a.views;
            return Date.parse(b.viewedAt) - Date.parse(a.viewedAt);
          })
          .slice(0, limit),

      count: () => get().items.length,
    }),
    {
      name: currentProfileStorageKey("view-history"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

registerProfileScopedStore(useViewHistoryStore, "view-history");
