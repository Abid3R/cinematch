/**
 * Store barrel — public surface of the Zustand layer.
 *
 * Components and React Query hooks import from `@/store` so the underlying
 * file structure can evolve without touching call-sites. The barrel also
 * exposes lightweight selectors (e.g. `collectUserSignals`) and storage
 * helpers used by debug tooling.
 */

export { persistStorage, storageKey, STORAGE_PREFIX } from "./storage";
export { useThemeStore, resolveEffectiveTheme } from "./theme";
export { useWatchlistStore } from "./watchlist";
export { useLikesStore } from "./likes";
export { useRatingsStore } from "./ratings";
export { useSearchHistoryStore } from "./search-history";
export { useViewHistoryStore } from "./view-history";
export { useOnboardingStore } from "./onboarding";
export { usePreferencesStore } from "./preferences";
export type { AccentColor, Preferences } from "./preferences";
export { collectUserSignals, signalCount } from "./signals";
