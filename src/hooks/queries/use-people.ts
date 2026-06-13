/**
 * People hooks — person details and their movie filmography.
 *
 * Filmography rarely changes after release dates settle, so we cache people
 * data aggressively and refetch on reconnect rather than on focus.
 */

"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getPersonDetails,
  getPersonMovieCredits,
  type PersonDetails,
  type PersonMovieCredits,
} from "@/services/tmdb";

import { queryKeys } from "./keys";

const DAY = 24 * 60 * 60 * 1000;

export function usePersonDetails(
  id: number | null | undefined,
): UseQueryResult<PersonDetails> {
  return useQuery({
    queryKey: queryKeys.people.details(id ?? 0),
    queryFn: () => getPersonDetails(id as number),
    staleTime: 7 * DAY,
    gcTime: 14 * DAY,
    enabled: typeof id === "number" && id > 0,
  });
}

export function usePersonMovieCredits(
  id: number | null | undefined,
): UseQueryResult<PersonMovieCredits> {
  return useQuery({
    queryKey: queryKeys.people.credits(id ?? 0),
    queryFn: () => getPersonMovieCredits(id as number),
    staleTime: 7 * DAY,
    gcTime: 14 * DAY,
    enabled: typeof id === "number" && id > 0,
  });
}
