/**
 * Onboarding store — cold-start preference capture.
 *
 * Mirrors the multi-step onboarding flow: pick favorite genres, then favorite
 * movies, then optional actors / directors. The captured selections are fed
 * directly into `buildUserProfile` via `UserSignalSources.onboardingGenres`
 * so first-run recommendations are personalized from the start.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OnboardingSelections } from "@/types/user";

import { currentProfileStorageKey, registerProfileScopedStore } from "./profile-scoped";
import { persistStorage } from "./storage";

interface OnboardingState extends OnboardingSelections {
  /** Last step the user reached, useful for resumable flows. */
  lastStep: number;

  toggleGenre: (id: number) => void;
  setGenres: (ids: number[]) => void;

  toggleMovie: (id: number) => void;
  setMovies: (ids: number[]) => void;

  toggleActor: (id: number) => void;
  setActors: (ids: number[]) => void;

  toggleDirector: (id: number) => void;
  setDirectors: (ids: number[]) => void;

  setLastStep: (step: number) => void;
  complete: () => void;
  reset: () => void;

  hasSelections: () => boolean;
  selectionCount: () => number;
}

const EMPTY: OnboardingSelections = {
  genreIds: [],
  movieIds: [],
  actorIds: [],
  directorIds: [],
  completed: false,
};

function toggle(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      lastStep: 0,

      toggleGenre: (id) => set((state) => ({ genreIds: toggle(state.genreIds, id) })),
      setGenres: (ids) => set({ genreIds: Array.from(new Set(ids)) }),

      toggleMovie: (id) => set((state) => ({ movieIds: toggle(state.movieIds, id) })),
      setMovies: (ids) => set({ movieIds: Array.from(new Set(ids)) }),

      toggleActor: (id) => set((state) => ({ actorIds: toggle(state.actorIds, id) })),
      setActors: (ids) => set({ actorIds: Array.from(new Set(ids)) }),

      toggleDirector: (id) =>
        set((state) => ({ directorIds: toggle(state.directorIds, id) })),
      setDirectors: (ids) => set({ directorIds: Array.from(new Set(ids)) }),

      setLastStep: (step) => set({ lastStep: Math.max(0, Math.floor(step)) }),

      complete: () => set({ completed: true }),

      reset: () => set({ ...EMPTY, lastStep: 0 }),

      hasSelections: () => {
        const s = get();
        return (
          s.genreIds.length > 0 ||
          s.movieIds.length > 0 ||
          s.actorIds.length > 0 ||
          s.directorIds.length > 0
        );
      },

      selectionCount: () => {
        const s = get();
        return (
          s.genreIds.length +
          s.movieIds.length +
          s.actorIds.length +
          s.directorIds.length
        );
      },
    }),
    {
      name: currentProfileStorageKey("onboarding"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({
        genreIds: state.genreIds,
        movieIds: state.movieIds,
        actorIds: state.actorIds,
        directorIds: state.directorIds,
        completed: state.completed,
        lastStep: state.lastStep,
      }),
    },
  ),
);

registerProfileScopedStore(useOnboardingStore, "onboarding");
