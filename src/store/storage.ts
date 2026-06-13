/**
 * SSR-safe storage adapter for Zustand `persist` middleware.
 *
 * Next.js renders stores on the server during the first pass where `window`
 * (and therefore `localStorage`) is undefined. Returning a no-op storage on
 * the server keeps hydration clean and avoids ReferenceErrors. On the client,
 * we delegate to `localStorage`.
 */

import { createJSONStorage, type StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * Returns `localStorage` when running in the browser, otherwise a no-op
 * implementation so SSR doesn't blow up. Wrapped in `createJSONStorage` to
 * get automatic JSON (de)serialization.
 */
export const persistStorage = createJSONStorage<unknown>(() => {
  if (typeof window === "undefined") return noopStorage;
  return window.localStorage;
});

/**
 * Centralized storage key prefix so every persisted store sits under the same
 * namespace in localStorage. Bumping the suffix invalidates older snapshots
 * across the whole app.
 */
export const STORAGE_PREFIX = "cinematch:v1";

export const storageKey = (name: string) => `${STORAGE_PREFIX}:${name}`;

/**
 * Returns a storage key scoped to a specific profile. All per-user stores
 * (watchlist, ratings, view history, etc.) use this so multiple profiles on
 * the same browser don't trample each other's data.
 *
 *   profileStorageKey("default", "watchlist") → "cinematch:v1:profile:default:watchlist"
 */
export const profileStorageKey = (profileId: string, name: string) =>
  `${STORAGE_PREFIX}:profile:${profileId}:${name}`;
