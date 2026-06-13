/**
 * Likes store — explicit thumbs-up / thumbs-down on movies.
 *
 * Drives two core engine inputs:
 *  - Positive signal weight (boosts genres / cast / directors / keywords).
 *  - Hard "never show this again" filter on disliked titles.
 *
 * Likes and dislikes are mutually exclusive per movie. Toggling the same state
 * twice clears it (so disliking a disliked movie removes the dislike).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Movie } from "@/types/tmdb";
import type { LikeState, LikedMovie, WatchlistItem } from "@/types/user";

import { currentProfileStorageKey, registerProfileScopedStore } from "./profile-scoped";
import { persistStorage } from "./storage";

interface LikesState {
  items: LikedMovie[];

  setLike: (movie: Movie, state: LikeState) => void;
  clearLike: (movieId: number) => void;
  toggleLike: (movie: Movie) => void;
  toggleDislike: (movie: Movie) => void;
  clear: () => void;

  getState: (movieId: number) => LikeState | undefined;
  liked: () => LikedMovie[];
  disliked: () => LikedMovie[];
  likedIds: () => Set<number>;
  dislikedIds: () => Set<number>;
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

function upsert(
  items: LikedMovie[],
  movie: Movie,
  state: LikeState,
): LikedMovie[] {
  const idx = items.findIndex((item) => item.movieId === movie.id);
  const entry: LikedMovie = {
    movieId: movie.id,
    movie: snapshot(movie),
    state,
    updatedAt: new Date().toISOString(),
  };
  if (idx === -1) return [entry, ...items];
  const next = items.slice();
  next[idx] = entry;
  return next;
}

export const useLikesStore = create<LikesState>()(
  persist(
    (set, get) => ({
      items: [],

      setLike: (movie, state) =>
        set((s) => ({ items: upsert(s.items, movie, state) })),

      clearLike: (movieId) =>
        set((s) => ({
          items: s.items.filter((item) => item.movieId !== movieId),
        })),

      toggleLike: (movie) => {
        const current = get().getState(movie.id);
        if (current === "liked") get().clearLike(movie.id);
        else get().setLike(movie, "liked");
      },

      toggleDislike: (movie) => {
        const current = get().getState(movie.id);
        if (current === "disliked") get().clearLike(movie.id);
        else get().setLike(movie, "disliked");
      },

      clear: () => set({ items: [] }),

      getState: (movieId) =>
        get().items.find((item) => item.movieId === movieId)?.state,

      liked: () => get().items.filter((item) => item.state === "liked"),
      disliked: () => get().items.filter((item) => item.state === "disliked"),

      likedIds: () =>
        new Set(
          get()
            .items.filter((item) => item.state === "liked")
            .map((item) => item.movieId),
        ),
      dislikedIds: () =>
        new Set(
          get()
            .items.filter((item) => item.state === "disliked")
            .map((item) => item.movieId),
        ),
    }),
    {
      name: currentProfileStorageKey("likes"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

registerProfileScopedStore(useLikesStore, "likes");
