/**
 * Search history store — recent queries with hit counts.
 *
 * Powers the command palette's "Recent searches" section, search suggestions,
 * and the analytics view's "Top queries" chart. Queries are deduped
 * case-insensitively and capped so localStorage never bloats.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SearchHistoryEntry } from "@/types/user";

import { currentProfileStorageKey, registerProfileScopedStore } from "./profile-scoped";
import { persistStorage } from "./storage";

/** Hard cap on retained queries — older entries are evicted. */
const MAX_ENTRIES = 50;

interface SearchHistoryState {
  items: SearchHistoryEntry[];

  record: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;

  recent: (limit?: number) => SearchHistoryEntry[];
  top: (limit?: number) => SearchHistoryEntry[];
}

/** Normalize for dedupe — trim + lowercase but preserve display casing. */
function key(query: string): string {
  return query.trim().toLowerCase();
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      record: (rawQuery) =>
        set((state) => {
          const query = rawQuery.trim();
          if (!query) return state;

          const k = key(query);
          const now = new Date().toISOString();
          const existing = state.items.find((item) => key(item.query) === k);

          if (existing) {
            const next = state.items.filter((item) => key(item.query) !== k);
            return {
              items: [
                {
                  ...existing,
                  query, // refresh display casing
                  searchedAt: now,
                  hits: existing.hits + 1,
                },
                ...next,
              ],
            };
          }

          const next: SearchHistoryEntry = {
            query,
            searchedAt: now,
            hits: 1,
          };
          return { items: [next, ...state.items].slice(0, MAX_ENTRIES) };
        }),

      remove: (query) =>
        set((state) => {
          const k = key(query);
          return { items: state.items.filter((item) => key(item.query) !== k) };
        }),

      clear: () => set({ items: [] }),

      recent: (limit = 10) => get().items.slice(0, limit),

      top: (limit = 10) =>
        get()
          .items.slice()
          .sort((a, b) => {
            if (b.hits !== a.hits) return b.hits - a.hits;
            return Date.parse(b.searchedAt) - Date.parse(a.searchedAt);
          })
          .slice(0, limit),
    }),
    {
      name: currentProfileStorageKey("search-history"),
      storage: persistStorage,
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

registerProfileScopedStore(useSearchHistoryStore, "search-history");
