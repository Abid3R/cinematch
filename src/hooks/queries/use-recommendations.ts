/**
 * Recommendation hooks.
 *
 * The recommendation engine (`@/services/recommendation`) is a pure function of
 * the user's `UserSignalSources` — a map of interacted movie ids to their full
 * TMDB details. This file is the glue that turns the *lightweight* state in
 * Zustand stores into that fully-hydrated source map and caches each stage
 * through React Query.
 *
 * Pipeline:
 *
 *   Stores  ──► collectUserSignals()  ──► interactedMovieIds
 *                                              │
 *                                              ▼
 *                               parallel getMovieDetails(id)  (TMDB)
 *                                              │
 *                                              ▼
 *                                  UserSignalSources  ◄── useSignalSources()
 *                                              │
 *                                              ▼
 *                                  buildUserProfile()
 *                                              │
 *                                              ▼
 *           recommend()  /  recommendHiddenGems()  /  rankSimilar()
 *                                              │
 *                                              ▼
 *                                   ScoredRecommendation[]
 *
 * Caching strategy:
 *  - The signal-source map is keyed on `signalCount`. Any new like / rating /
 *    watchlist entry naturally bumps the count and forks a fresh cache entry,
 *    so we never serve a stale source map.
 *  - The final ranking is keyed on `(signalCount, poolSize)` so changing the
 *    candidate-pool boundary (e.g. asking for a deeper sweep) reuses the
 *    underlying source map but recomputes the ranking.
 *  - The candidate pool itself is sourced via the existing TMDB hooks (popular
 *    + top-rated + by-genre slices), so we benefit from their own caches and
 *    avoid re-querying TMDB for the rank step.
 */

"use client";

import {
  type UseQueryOptions,
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import {
  buildUserProfile,
  emptyUserProfile,
  rankSimilar,
  recommend,
  recommendHiddenGems,
  type RecommendOptions,
  type ScoredRecommendation,
  type UserProfile,
  type UserSignalSources,
} from "@/services/recommendation";
import {
  discoverMovies,
  getMovieDetails,
  getPopular,
  getSimilarMovies,
  getTopRated,
} from "@/services/tmdb";
import { useLikesStore } from "@/store/likes";
import { useOnboardingStore } from "@/store/onboarding";
import { useRatingsStore } from "@/store/ratings";
import { useViewHistoryStore } from "@/store/view-history";
import { useWatchlistStore } from "@/store/watchlist";
import { signalCount as totalSignalCount } from "@/store/signals";
import type { Movie, MovieDetails } from "@/types/tmdb";

import { queryKeys } from "./keys";

const DAY = 1000 * 60 * 60 * 24;

/** Default number of candidates pulled from TMDB before scoring/ranking. */
const DEFAULT_POOL_SIZE = 240;

/** Slice sizes for the candidate pool. Sums to a little over `DEFAULT_POOL_SIZE`. */
const POOL_POPULAR_PAGES = 3; // ~60 titles
const POOL_TOP_RATED_PAGES = 3; // ~60 titles
const POOL_GENRE_PAGES = 1; // per onboarding genre

/** Movies we collected enough metadata on to feed the engine. */
type DetailMap = Map<number, MovieDetails>;

interface SignalSnapshot {
  likedIds: number[];
  dislikedIds: number[];
  watchlistIds: number[];
  watchedIds: number[];
  ratings: Array<{ movieId: number; rating: number }>;
  onboardingGenres: number[];
  signalCount: number;
}

/**
 * Read every store once and project the ids the engine needs. Done outside the
 * React render path inside `queryFn` so we always see fresh state.
 */
function snapshotSignals(): SignalSnapshot {
  const likes = useLikesStore.getState();
  const watchlist = useWatchlistStore.getState();
  const history = useViewHistoryStore.getState();
  const ratings = useRatingsStore.getState();
  const onboarding = useOnboardingStore.getState();

  const likedIds = likes.items
    .filter((item) => item.state === "liked")
    .map((item) => item.movieId);
  const dislikedIds = likes.items
    .filter((item) => item.state === "disliked")
    .map((item) => item.movieId);
  const watchlistIds = watchlist.items.map((item) => item.movieId);
  const watchedIds = history.items.map((item) => item.movieId);
  const ratingPairs = ratings.items.map((item) => ({
    movieId: item.movieId,
    rating: item.rating,
  }));

  return {
    likedIds,
    dislikedIds,
    watchlistIds,
    watchedIds,
    ratings: ratingPairs,
    onboardingGenres: onboarding.genreIds.slice(),
    signalCount: totalSignalCount(),
  };
}

/**
 * Fetch `getMovieDetails` for every id in the union of the user's signal sets
 * in parallel, then partition them back into the `UserSignalSources` shape the
 * engine expects.
 *
 * Cached for a full day because details rarely change — and the cache key is
 * derived from the signal count, so any new interaction starts a fresh entry.
 */
export function useSignalSources() {
  const snapshot = snapshotSignals();

  return useQuery<UserSignalSources>({
    queryKey: queryKeys.reco.sources(snapshot.signalCount),
    queryFn: async () => {
      const uniqueIds = Array.from(
        new Set<number>([
          ...snapshot.likedIds,
          ...snapshot.dislikedIds,
          ...snapshot.watchlistIds,
          ...snapshot.watchedIds,
          ...snapshot.ratings.map((r) => r.movieId),
        ]),
      );

      const detailEntries = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const details = await getMovieDetails(id);
            return [id, details] as const;
          } catch {
            // A single 404 / 401 shouldn't kill the whole recommendation pass —
            // we drop the offending id and continue. The engine is robust to
            // missing entries because it only ranks what it sees.
            return null;
          }
        }),
      );

      const detailMap: DetailMap = new Map();
      for (const entry of detailEntries) {
        if (entry) detailMap.set(entry[0], entry[1]);
      }

      const pickInto = (ids: number[]): Map<number, MovieDetails> => {
        const out = new Map<number, MovieDetails>();
        for (const id of ids) {
          const d = detailMap.get(id);
          if (d) out.set(id, d);
        }
        return out;
      };

      const ratingMap = new Map<
        number,
        { rating: number; details: MovieDetails }
      >();
      for (const { movieId, rating } of snapshot.ratings) {
        const d = detailMap.get(movieId);
        if (d) ratingMap.set(movieId, { rating, details: d });
      }

      const sources: UserSignalSources = {
        liked: pickInto(snapshot.likedIds),
        disliked: pickInto(snapshot.dislikedIds),
        watchlist: pickInto(snapshot.watchlistIds),
        watched: pickInto(snapshot.watchedIds),
        ratings: ratingMap,
        onboardingGenres: snapshot.onboardingGenres,
      };
      return sources;
    },
    staleTime: DAY,
    gcTime: DAY * 7,
  });
}

/**
 * Memoize the derived `UserProfile`. The profile is small but computing it
 * involves iterating every detail's genres/cast/crew/keywords, so caching it
 * by signal-count gives every downstream hook the same instance.
 */
export function useUserProfile() {
  const sourcesQuery = useSignalSources();
  const sources = sourcesQuery.data;
  const profile: UserProfile = sources ? buildUserProfile(sources) : emptyUserProfile();

  return {
    ...sourcesQuery,
    profile,
  };
}

/** Builds the candidate pool from popular + top-rated + a per-genre sweep. */
async function fetchCandidatePool(
  onboardingGenres: number[],
  poolSize: number,
): Promise<Movie[]> {
  const requests: Array<Promise<{ results: Movie[] }>> = [];

  for (let page = 1; page <= POOL_POPULAR_PAGES; page += 1) {
    requests.push(getPopular(page));
  }
  for (let page = 1; page <= POOL_TOP_RATED_PAGES; page += 1) {
    requests.push(getTopRated(page));
  }
  for (const genreId of onboardingGenres.slice(0, 4)) {
    for (let page = 1; page <= POOL_GENRE_PAGES; page += 1) {
      requests.push(
        discoverMovies({
          page,
          with_genres: genreId.toString(),
          sort_by: "popularity.desc",
        }),
      );
    }
  }

  const pages = await Promise.allSettled(requests);
  const dedup = new Map<number, Movie>();
  for (const settled of pages) {
    if (settled.status !== "fulfilled") continue;
    for (const movie of settled.value.results) {
      if (!dedup.has(movie.id)) dedup.set(movie.id, movie);
    }
  }
  return Array.from(dedup.values()).slice(0, poolSize);
}

export interface UseRecommendationsOptions extends RecommendOptions {
  /** Override the candidate pool size (defaults to ~240). */
  poolSize?: number;
  /** Standard React Query opt-out. */
  enabled?: boolean;
}

/**
 * Final personalized ranking. Composes the cached signal-source map + a fresh
 * candidate pool and runs `recommend()`. Returns an array of
 * `ScoredRecommendation` (movie + breakdown + reasons).
 */
export function usePersonalizedRecommendations(
  options: UseRecommendationsOptions = {},
) {
  const {
    poolSize = DEFAULT_POOL_SIZE,
    enabled = true,
    limit,
    includeSeen,
    minScore,
  } = options;

  const sourcesQuery = useSignalSources();
  const sources = sourcesQuery.data;
  const signalCount = sources
    ? sources.liked.size +
      sources.disliked.size +
      sources.watchlist.size +
      sources.watched.size +
      sources.ratings.size +
      sources.onboardingGenres.length
    : 0;

  return useQuery<ScoredRecommendation[]>({
    queryKey: queryKeys.reco.personalized(signalCount, poolSize),
    queryFn: async () => {
      if (!sources) return [];
      const pool = await fetchCandidatePool(sources.onboardingGenres, poolSize);
      const profile = buildUserProfile(sources);
      const detailsMap = new Map<number, MovieDetails>([
        ...sources.liked,
        ...sources.disliked,
        ...sources.watchlist,
        ...sources.watched,
        ...Array.from(sources.ratings, ([id, entry]) => [id, entry.details] as const),
      ]);
      return recommend(
        pool,
        profile,
        {
          limit,
          includeSeen,
          minScore,
        },
        detailsMap,
      );
    },
    enabled: enabled && sourcesQuery.isSuccess,
    staleTime: DAY,
    gcTime: DAY * 2,
  });
}

/**
 * Hidden-gem ranking — same pool, different scorer. Surfaces high-affinity
 * matches that haven't broken into the mainstream.
 */
export function useHiddenGemRecommendations(
  options: UseRecommendationsOptions = {},
) {
  const {
    poolSize = DEFAULT_POOL_SIZE,
    enabled = true,
    limit,
    includeSeen,
    minScore,
  } = options;

  const sourcesQuery = useSignalSources();
  const sources = sourcesQuery.data;
  const signalCount = sources
    ? sources.liked.size +
      sources.disliked.size +
      sources.watchlist.size +
      sources.watched.size +
      sources.ratings.size +
      sources.onboardingGenres.length
    : 0;

  return useQuery<ScoredRecommendation[]>({
    queryKey: queryKeys.reco.hiddenGems(signalCount, poolSize),
    queryFn: async () => {
      if (!sources) return [];
      const pool = await fetchCandidatePool(sources.onboardingGenres, poolSize);
      const profile = buildUserProfile(sources);
      const detailsMap = new Map<number, MovieDetails>([
        ...sources.liked,
        ...sources.disliked,
        ...sources.watchlist,
        ...sources.watched,
        ...Array.from(sources.ratings, ([id, entry]) => [id, entry.details] as const),
      ]);
      return recommendHiddenGems(
        pool,
        profile,
        {
          limit,
          includeSeen,
          minScore,
        },
        detailsMap,
      );
    },
    enabled: enabled && sourcesQuery.isSuccess,
    staleTime: DAY,
    gcTime: DAY * 2,
  });
}

export interface UseRankedSimilarOptions {
  enabled?: boolean;
  limit?: number;
}

/**
 * "Because you watched X" ranking. Pulls TMDB's similar feed for the anchor
 * movie, then re-ranks it against the user's taste profile so the order
 * reflects personal affinity rather than TMDB's generic similarity score.
 */
export function useRankedSimilar(
  anchorMovieId: number | undefined,
  options: UseRankedSimilarOptions = {},
) {
  const { enabled = true, limit } = options;
  const sourcesQuery = useSignalSources();
  const sources = sourcesQuery.data;
  const signalCount = sources
    ? sources.liked.size +
      sources.disliked.size +
      sources.watchlist.size +
      sources.watched.size +
      sources.ratings.size +
      sources.onboardingGenres.length
    : 0;

  return useQuery<ScoredRecommendation[]>({
    queryKey: queryKeys.reco.similarRanked(anchorMovieId ?? 0, signalCount),
    queryFn: async () => {
      if (!sources || typeof anchorMovieId !== "number") return [];
      const [anchor, similar] = await Promise.all([
        getMovieDetails(anchorMovieId),
        getSimilarMovies(anchorMovieId),
      ]);
      const profile = buildUserProfile(sources);
      const detailsMap = new Map<number, MovieDetails>([
        ...sources.liked,
        ...sources.disliked,
        ...sources.watchlist,
        ...sources.watched,
        ...Array.from(sources.ratings, ([id, entry]) => [id, entry.details] as const),
        [anchor.id, anchor],
      ]);
      const anchorMovie: Movie = { ...anchor, genre_ids: anchor.genres?.map((g) => g.id) ?? [] };
      return rankSimilar(anchorMovie, similar.results, profile, { limit }, detailsMap);
    },
    enabled:
      enabled &&
      sourcesQuery.isSuccess &&
      typeof anchorMovieId === "number" &&
      anchorMovieId > 0,
    staleTime: DAY,
    gcTime: DAY * 2,
  });
}

/**
 * Convenience hook for fetching multiple movies' details in parallel. Used by
 * the "Your top-rated" / "Liked recently" surfaces that already have ids but
 * need full details for the card.
 *
 * Each id gets its own cache entry under `queryKeys.movies.details(id)` so it
 * deduplicates with anything else fetching the same details.
 */
export function useMovieDetailsList(
  ids: number[],
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;

  return useQueries({
    queries: ids.map((id) =>
      ({
        queryKey: queryKeys.movies.details(id),
        queryFn: () => getMovieDetails(id),
        enabled: enabled && id > 0,
        staleTime: DAY * 7,
        gcTime: DAY * 14,
      }) satisfies UseQueryOptions<MovieDetails>,
    ),
  });
}
