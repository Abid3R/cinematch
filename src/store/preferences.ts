/**
 * Preferences store — global user settings unrelated to per-movie state.
 *
 * Covers region / language for TMDB localization, content gating, motion
 * preferences for the animated background, and recommendation feed toggles.
 * Kept separate from onboarding selections so power users can tune the feed
 * without re-running the cold-start flow.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { persistStorage, storageKey } from "./storage";

/** Recharts dashboards default to a polished palette — let users override. */
export type AccentColor = "amber" | "violet" | "emerald" | "rose" | "sky";

export interface Preferences {
  /** ISO-3166-1 region code used for TMDB localized release dates. */
  region: string;
  /** ISO-639-1 language code used for TMDB localized titles & overviews. */
  language: string;
  /** Allow adult content in discovery / search. Off by default. */
  includeAdult: boolean;
  /** Reduce motion across the animated background and transitions. */
  reduceMotion: boolean;
  /** Auto-play trailers on the details page. */
  autoplayTrailers: boolean;
  /** Bias the home feed toward hidden gems. */
  preferHiddenGems: boolean;
  /** Hide spoilers (e.g. plot synopsis on cards). */
  hideSpoilers: boolean;
  /** Accent color used by the UI and chart palettes. */
  accentColor: AccentColor;
}

interface PreferencesState extends Preferences {
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  patch: (patch: Partial<Preferences>) => void;
  reset: () => void;
}

const DEFAULTS: Preferences = {
  region: "US",
  language: "en-US",
  includeAdult: false,
  reduceMotion: false,
  autoplayTrailers: true,
  preferHiddenGems: false,
  hideSpoilers: false,
  accentColor: "amber",
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      set: (key, value) => set({ [key]: value } as Partial<PreferencesState>),
      patch: (patch) => set(patch as Partial<PreferencesState>),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: storageKey("preferences"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({
        region: state.region,
        language: state.language,
        includeAdult: state.includeAdult,
        reduceMotion: state.reduceMotion,
        autoplayTrailers: state.autoplayTrailers,
        preferHiddenGems: state.preferHiddenGems,
        hideSpoilers: state.hideSpoilers,
        accentColor: state.accentColor,
      }),
    },
  ),
);
