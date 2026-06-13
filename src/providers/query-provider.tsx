/**
 * React Query client provider.
 *
 * Mounted once at the root of the App Router tree (see `src/app/layout.tsx`).
 * The `QueryClient` is created with `useState` so each browser session gets
 * its own instance — critical for Next.js because shipping a module-level
 * singleton would leak request state between users on the server.
 *
 * Defaults are tuned for a media catalog UI:
 *  - `staleTime: 5 minutes` — TMDB feeds (trending/popular/etc.) don't change
 *    often, so we avoid network noise when the user toggles between pages.
 *  - `gcTime: 30 minutes` — keep the cache warm across navigation without
 *    growing memory unbounded.
 *  - `refetchOnWindowFocus: false` — re-querying every focus event would be
 *    distracting on a content site (vs. a dashboard).
 *  - `retry` — bail out fast on permanent failures (404/401/etc.), retry up
 *    to two times on transient ones.
 *
 * React Query DevTools are mounted in dev only, behind the `NODE_ENV` check,
 * so the production bundle stays clean.
 */
"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

import { TmdbError } from "@/services/tmdb";

/**
 * Construct a fresh `QueryClient`. Called by `useState`'s lazy initializer
 * so it runs exactly once per mount.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Centralized logging keeps the per-hook code free of try/catch.
        // Errors thrown by hooks still propagate through React Query's
        // standard `error` field — this hook only adds observability.
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(
            `[react-query] ${String(query.queryKey)} failed`,
            error,
          );
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
        retry: (failureCount, error) => {
          // Surface TMDB 4xx errors immediately — retrying won't fix them.
          if (error instanceof TmdbError) {
            if (error.status && error.status >= 400 && error.status < 500) {
              return false;
            }
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) =>
          Math.min(1000 * 2 ** attempt, 8_000),
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  const [client] = useState(createQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      ) : null}
    </QueryClientProvider>
  );
}
