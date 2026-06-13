/**
 * Profiles store — manages multiple users on a single browser.
 *
 * Unlike every other store in the app, this one is NOT profile-scoped: it
 * holds the registry of profiles plus the currently active profile id. Other
 * stores read `activeProfileId` to namespace their localStorage keys so that
 * switching profiles swaps in a completely separate set of data (watchlist,
 * ratings, view history, etc.).
 *
 * A "default" profile is auto-created on first run so existing single-user
 * users get a seamless upgrade.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Profile } from "@/types/user";

import { persistStorage, storageKey } from "./storage";

const DEFAULT_PROFILE: Profile = {
  id: "default",
  name: "You",
  emoji: "🎬",
  createdAt: new Date(0).toISOString(),
};

const EMOJI_POOL = [
  "🎬", "🍿", "🎞️", "🎟️", "🎭", "🌟", "⭐", "🚀",
  "🦊", "🐯", "🐼", "🐧", "🐙", "🦄", "🐲", "🌈",
];

function randomEmoji(used: string[]): string {
  const available = EMOJI_POOL.filter((e) => !used.includes(e));
  const pool = available.length > 0 ? available : EMOJI_POOL;
  return pool[Math.floor(Math.random() * pool.length)] ?? "🎬";
}

function makeId(): string {
  // Simple URL-safe id — no need for full uuid here.
  return `p-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string;

  /** Create a new profile and switch to it. Returns the new profile. */
  createProfile: (name: string, emoji?: string) => Profile;
  /** Switch to an existing profile. No-op if id is unknown. */
  switchProfile: (id: string) => void;
  /** Rename a profile in place. */
  renameProfile: (id: string, name: string) => void;
  /** Change a profile's emoji avatar. */
  setEmoji: (id: string, emoji: string) => void;
  /**
   * Delete a profile. If the active profile is removed, the first remaining
   * profile becomes active. The last profile cannot be deleted — at least one
   * profile must exist.
   */
  deleteProfile: (id: string) => void;

  activeProfile: () => Profile;
  hasMultiple: () => boolean;
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      activeProfileId: DEFAULT_PROFILE.id,

      createProfile: (name, emoji) => {
        const trimmed = name.trim() || "New profile";
        const used = get().profiles.map((p) => p.emoji);
        const next: Profile = {
          id: makeId(),
          name: trimmed,
          emoji: emoji || randomEmoji(used),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          profiles: [...state.profiles, next],
          activeProfileId: next.id,
        }));
        return next;
      },

      switchProfile: (id) => {
        const exists = get().profiles.some((p) => p.id === id);
        if (!exists) return;
        if (get().activeProfileId === id) return;
        set({ activeProfileId: id });
      },

      renameProfile: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, name: trimmed } : p,
          ),
        }));
      },

      setEmoji: (id, emoji) => {
        if (!emoji) return;
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, emoji } : p,
          ),
        }));
      },

      deleteProfile: (id) =>
        set((state) => {
          if (state.profiles.length <= 1) return state;
          const remaining = state.profiles.filter((p) => p.id !== id);
          const activeProfileId =
            state.activeProfileId === id
              ? (remaining[0]?.id ?? DEFAULT_PROFILE.id)
              : state.activeProfileId;
          return { profiles: remaining, activeProfileId };
        }),

      activeProfile: () => {
        const { profiles, activeProfileId } = get();
        return (
          profiles.find((p) => p.id === activeProfileId) ??
          profiles[0] ??
          DEFAULT_PROFILE
        );
      },

      hasMultiple: () => get().profiles.length > 1,
    }),
    {
      name: storageKey("profiles"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
    },
  ),
);

/**
 * Synchronous accessor used during store creation in other modules so the
 * initial persist key already targets the right profile namespace.
 */
export function getActiveProfileId(): string {
  return useProfilesStore.getState().activeProfileId;
}
