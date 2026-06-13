/**
 * Barrel export for the React Query hook layer.
 *
 * Everything UI code needs from `@/hooks/queries` should be re-exported here so
 * imports stay one-deep:
 *
 *   import { useTrending, usePersonalizedRecommendations } from "@/hooks/queries";
 *
 * Keep this file flat — no re-mapped names, no logic — so a future grep across
 * the codebase always lands on the real definition.
 */

export { queryKeys, type QueryKeys } from "./keys";

export { useDebouncedValue } from "./use-debounced-value";

export {
  useMovieDetails,
  useMovieTmdbRecommendations,
  useNowPlaying,
  usePopular,
  usePopularInfinite,
  useSimilarMovies,
  useTopRated,
  useTopRatedInfinite,
  useTrending,
  useTrendingInfinite,
  useUpcoming,
} from "./use-movies";

export {
  useDiscover,
  useDiscoverInfinite,
  useGenreShowcase,
} from "./use-discover";

export {
  useSearchMovies,
  useSearchMulti,
  useSearchPeople,
  type UseSearchOptions,
} from "./use-search";

export { usePersonDetails, usePersonMovieCredits } from "./use-people";

export { useGenreMap, useMovieGenres } from "./use-genres";

export {
  useHiddenGemRecommendations,
  useMovieDetailsList,
  usePersonalizedRecommendations,
  useRankedSimilar,
  useSignalSources,
  useUserProfile,
  type UseRankedSimilarOptions,
  type UseRecommendationsOptions,
} from "./use-recommendations";
