/**
 * Profile-scoped persistence wiring.
 *
 * Every per-user store (watchlist, ratings, view history, etc.) registers
 * itself here. When the active profile changes we walk the registry, re-key
 * each store's persist middleware to the new profile's namespace, and trigger
 * a fresh rehydrate so the in-memory state reflects that profile's saved data.
 *
 * The registry pattern lets us add new profile-scoped stores without touching
 * the switching logic.
 */

import type { StoreApi, UseBoundStore } from "zustand";

import { profileStorageKey } from "./storage";
import { getActiveProfileId, useProfilesStore } from "./profiles";

/**
 * Minimal subset of the zustand persist API we depend on. We only need
 * `setOptions({ name })` to swap the storage key and `rehydrate()` to reload
 * state for that key.
 */
interface PersistableApi {
  persist: {
    setOptions: (options: { name?: string }) => void;
    rehydrate: () => Promise<void> | void;
    clearStorage?: () => void;
  };
}

type ProfileScopedStore = UseBoundStore<StoreApi<unknown>> & PersistableApi;

interface Registration {
  store: ProfileScopedStore;
  /** Logical store name (e.g. "watchlist"). Combined with the profile id. */
  name: string;
}

const registry: Registration[] = [];

/**
 * Compute the localStorage key a profile-scoped store should use right now.
 * Stores call this when they're first constructed.
 */
export function currentProfileStorageKey(name: string): string {
  return profileStorageKey(getActiveProfileId(), name);
}

/**
 * Register a store so its persist key is automatically re-targeted whenever
 * the active profile changes.
 */
export function registerProfileScopedStore(
  store: UseBoundStore<StoreApi<unknown>>,
  name: string,
): void {
  // The zustand persist middleware augments the bound store with a `persist`
  // property at runtime; we cast through `unknown` rather than `any` to keep
  // TypeScript strict happy.
  const persistable = store as unknown as ProfileScopedStore;
  if (!persistable.persist || typeof persistable.persist.setOptions !== "function") {
    return;
  }
  if (registry.some((r) => r.store === persistable && r.name === name)) return;
  registry.push({ store: persistable, name });
}

/**
 * Re-key every registered store to the given profile and rehydrate.
 *
 * On the server (where `window` is undefined and the persist storage adapter
 * is a no-op), this still safely sets options but rehydrate is a no-op.
 */
async function applyProfile(profileId: string): Promise<void> {
  for (const { store, name } of registry) {
    const key = profileStorageKey(profileId, name);
    store.persist.setOptions({ name: key });
    try {
      await store.persist.rehydrate();
    } catch {
      // Swallow — a missing snapshot just means we keep the default state.
    }
  }
}

let lastProfileId: string | null = null;
let subscribed = false;

/**
 * Subscribe (once, lazily) to profile changes and re-hydrate stores on switch.
 * Safe to call from any module load — guarded by `subscribed` so additional
 * imports don't pile up listeners.
 */
export function ensureProfileSwitcherSubscribed(): void {
  if (subscribed) return;
  subscribed = true;
  lastProfileId = useProfilesStore.getState().activeProfileId;

  useProfilesStore.subscribe((state) => {
    const next = state.activeProfileId;
    if (next === lastProfileId) return;
    lastProfileId = next;
    void applyProfile(next);
  });
}

// Subscribe at module load so we don't miss any switches.
ensureProfileSwitcherSubscribed();
