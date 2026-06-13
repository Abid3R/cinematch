/**
 * Genre hooks — TMDB's static-ish list of movie genres.
 *
 * Genres effectively never change so we cache them for the lifetime of the
 * session (`staleTime: Infinity`). The service already falls back to the
 * bundled `DEFAULT_GENRE_MAP` if the network call fails, so these hooks are
 * effectively non-failing.
 */

"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getGenreMap, getMovieGenres } from "@/services/tmdb";
import type { Genre } from "@/types/tmdb";

import { queryKeys } from "./keys";

export function useMovieGenres(): UseQueryResult<Genre[]> {
  return useQuery({
    queryKey: queryKeys.genres.list(),
    queryFn: () => getMovieGenres(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useGenreMap(): UseQueryResult<Record<number, string>> {
  return useQuery({
    queryKey: queryKeys.genres.map(),
    queryFn: () => getGenreMap(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
