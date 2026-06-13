/**
 * MovieGrid — responsive grid of MovieCards.
 *
 * Used by Discover, Search results, Watchlist, Likes, and Recommendations.
 * Density adjusts from 2 columns on phones up to 6 on widescreen. Supports
 * a skeleton mode and an `onEndReached` callback for infinite scroll.
 *
 * Keeping infinite-scroll concerns here (instead of in MovieRow) is deliberate:
 * grids are the only surface that ever needs to load more pages. Rows are
 * fixed-length curated lists.
 */
"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/utils/cn";

import { MovieCard, MovieCardSkeleton, type MovieCardData } from "./movie-card";

export interface MovieGridProps {
  movies: MovieCardData[] | undefined;
  /** When true, renders `skeletonCount` placeholder cards. */
  isLoading?: boolean;
  /** When provided, appended after the cards. Use for "Load more" sentinel. */
  isLoadingMore?: boolean;
  /** How many skeleton cards to render during the initial load. */
  skeletonCount?: number;
  /** IntersectionObserver callback — fires when the sentinel enters view. */
  onEndReached?: () => void;
  /** Display when `movies` is empty and not loading. */
  emptyState?: React.ReactNode;
  /** Card density override — useful for compact watchlist views. */
  density?: "compact" | "default" | "spacious";
  className?: string;
}

export function MovieGrid({
  movies,
  isLoading = false,
  isLoadingMore = false,
  skeletonCount = 12,
  onEndReached,
  emptyState,
  density = "default",
  className,
}: MovieGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onEndReached) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onEndReached();
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onEndReached, movies?.length]);

  const showEmpty = !isLoading && (!movies || movies.length === 0);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn(gridClass[density])}>
        {isLoading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <MovieCardSkeleton key={`skeleton-${i}`} />
            ))
          : null}

        {!isLoading && movies
          ? movies.map((movie, i) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                size="lg"
                priority={i < 6}
              />
            ))
          : null}

        {isLoadingMore
          ? Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={`more-skeleton-${i}`} />
            ))
          : null}
      </div>

      {showEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          {emptyState ?? (
            <>
              <p className="text-base font-medium text-ink">No movies found</p>
              <p className="text-sm text-ink-muted">
                Try adjusting filters or searching for a different title.
              </p>
            </>
          )}
        </div>
      ) : null}

      {/* Sentinel — placed at the end so the IO callback only fires after the
          last real card scrolls into view. */}
      {onEndReached ? (
        <div ref={sentinelRef} aria-hidden="true" className="h-1 w-full" />
      ) : null}
    </div>
  );
}

const gridClass: Record<NonNullable<MovieGridProps["density"]>, string> = {
  compact:
    "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
  default:
    "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  spacious:
    "grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
};
