/**
 * Theme store — dark/light/system mode with persistence.
 *
 * CineMatch is dark-first (the brand is cinematic black/midnight) but we still
 * expose a toggle for accessibility and personal preference. The "system" mode
 * defers to `prefers-color-scheme`.
 *
 * Hydration is handled in the ThemeProvider so the initial paint matches the
 * persisted mode and we avoid the dreaded light-flash on dark-mode users.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemeMode } from "@/types/user";

import { persistStorage, storageKey } from "./storage";

interface ThemeState {
  mode: ThemeMode;
  /** Set the current mode. Triggers `applyTheme` on subscribers. */
  setMode: (mode: ThemeMode) => void;
  /** Convenience cycler: dark → light → system → dark. */
  cycle: () => void;
}

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  dark: "light",
  light: "system",
  system: "dark",
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "dark",
      setMode: (mode) => set({ mode }),
      cycle: () => set({ mode: NEXT_MODE[get().mode] }),
    }),
    {
      name: storageKey("theme"),
      storage: persistStorage,
      version: 1,
    },
  ),
);

/**
 * Resolve the effective theme (always `"dark"` or `"light"`), honoring the
 * `"system"` setting by reading the OS preference. Safe to call during render —
 * returns `"dark"` on the server so SSR markup matches the dark-first default.
 */
export function resolveEffectiveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
