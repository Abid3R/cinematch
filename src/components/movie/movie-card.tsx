/**
 * MovieCard — clickable poster tile used in rows, grids, and search results.
 *
 * Composition:
 *  - `MoviePoster` (2:3 poster art)
 *  - rating chip (top-right) shown once `vote_average > 0`
 *  - hover overlay with title + year + quick actions:
 *      • watchlist toggle  (bookmark icon)
 *      • thumbs-up (like)  (heart icon)
 *      • thumbs-down       (thumbs-down icon)
 *
 * Accepts either a full TMDB `Movie` or the compact `WatchlistItem["movie"]`
 * snapshot stored by the watchlist/likes stores — they share the same fields
 * that this card needs to render.
 *
 * The hover overlay is keyboard accessible via focus-within so tab navigation
 * surfaces the same actions as mouse hover.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Star, ThumbsDown, ThumbsUp } from "lucide-react";

import type { PosterSize } from "@/constants/tmdb";
import { useLikesStore, useWatchlistStore } from "@/store";
import type { Movie } from "@/types/tmdb";
import type { WatchlistItem } from "@/types/user";
import { formatRating, formatYear, truncate } from "@/utils/format";
import { cn } from "@/utils/cn";

import { MoviePoster } from "./movie-poster";

/** Minimum shape a MovieCard can render — both Movie and the snapshot match. */
export type MovieCardData = Pick<
  Movie,
  | "id"
  | "title"
  | "poster_path"
  | "release_date"
  | "vote_average"
> & {
  backdrop_path?: string | null;
  genre_ids?: number[];
};

export interface MovieCardProps {
  movie: MovieCardData;
  /** Poster CDN size — drives both download cost and visual fidelity. */
  size?: PosterSize;
  /** Show the "Trending #1" style index badge. */
  rank?: number;
  /** Skip lazy-load for first-paint cards. */
  priority?: boolean;
  /** Disable the navigation link wrapper (e.g. inside a tile that's part of a CTA). */
  noLink?: boolean;
  /** Hide the hover-overlay quick-actions. */
  noActions?: boolean;
  className?: string;
}

export function MovieCard({
  movie,
  size = "lg",
  rank,
  priority = false,
  noLink = false,
  noActions = false,
  className,
}: MovieCardProps) {
  // Subscribe directly to the items arrays so the card re-renders when
  // watchlist/like state for THIS movie changes. Reading `state.has()` would
  // not trigger re-renders because Zustand compares the returned reference.
  const isInWatchlist = useWatchlistStore((s) =>
    s.items.some((item) => item.movieId === movie.id),
  );
  const likeState = useLikesStore(
    (s) => s.items.find((item) => item.movieId === movie.id)?.state,
  );

  const toggleWatchlist = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    useWatchlistStore.getState().toggle(movie as Movie);
  };

  const toggleLike = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    useLikesStore.getState().toggleLike(movie as Movie);
  };

  const toggleDislike = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    useLikesStore.getState().toggleDislike(movie as Movie);
  };

  const year = formatYear(movie.release_date);
  const rating = formatRating(movie.vote_average);
  const hasRating = (movie.vote_average ?? 0) > 0;

  const inner = (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "group relative isolate flex flex-col gap-2 outline-none",
        "focus-within:[&_.poster]:ring-2 focus-within:[&_.poster]:ring-brand-500/70",
        className,
      )}
    >
      <div className="poster relative overflow-hidden rounded-xl shadow-xl ring-1 ring-border/50 transition-shadow duration-300 group-hover:shadow-glow-soft">
        <MoviePoster path={movie.poster_path} size={size} alt={movie.title} priority={priority} />

        {/* Rank badge — only when explicitly provided (used by trending row). */}
        {typeof rank === "number" ? (
          <span className="pointer-events-none absolute -bottom-2 -left-2 select-none text-7xl font-black leading-none text-bg drop-shadow-[2px_0_0_rgba(255,45,85,0.9)] sm:text-8xl">
            {rank}
          </span>
        ) : null}

        {/* Rating chip — small, glass-y, top-right. */}
        {hasRating ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-bg/70 px-2 py-0.5 text-xs font-semibold text-ink backdrop-blur-md">
            <Star className="size-3 fill-warning text-warning" aria-hidden="true" />
            <span>{rating}</span>
          </div>
        ) : null}

        {/* Hover overlay — gradient bottom + quick actions. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col justify-end p-3",
            "bg-gradient-to-t from-bg/95 via-bg/60 to-transparent",
            "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            "group-focus-within:opacity-100",
          )}
        >
          <h3 className="line-clamp-2 text-sm font-semibold text-ink drop-shadow-md">
            {truncate(movie.title, 60)}
          </h3>
          {year ? (
            <span className="mt-0.5 text-xs text-ink-muted">{year}</span>
          ) : null}

          {!noActions ? (
            <div className="pointer-events-auto mt-3 flex items-center gap-1.5">
              <ActionButton
                label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                onClick={toggleWatchlist}
                active={isInWatchlist}
              >
                {isInWatchlist ? (
                  <BookmarkCheck className="size-4" aria-hidden="true" />
                ) : (
                  <Bookmark className="size-4" aria-hidden="true" />
                )}
              </ActionButton>
              <ActionButton
                label={likeState === "liked" ? "Unlike" : "Like"}
                onClick={toggleLike}
                active={likeState === "liked"}
                activeColor="success"
              >
                <ThumbsUp
                  className={cn("size-4", likeState === "liked" && "fill-current")}
                  aria-hidden="true"
                />
              </ActionButton>
              <ActionButton
                label={likeState === "disliked" ? "Remove dislike" : "Not interested"}
                onClick={toggleDislike}
                active={likeState === "disliked"}
                activeColor="danger"
              >
                <ThumbsDown
                  className={cn("size-4", likeState === "disliked" && "fill-current")}
                  aria-hidden="true"
                />
              </ActionButton>
            </div>
          ) : null}
        </div>
      </div>

      {/* Always-visible compact caption (below the poster). */}
      <div className="px-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-ink">{movie.title}</h3>
        {year ? (
          <span className="text-xs text-ink-subtle">{year}</span>
        ) : null}
      </div>
    </motion.div>
  );

  if (noLink) return inner;

  return (
    <Link
      href={`/movie/${movie.id}`}
      aria-label={`${movie.title}${year ? ` (${year})` : ""}`}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      {inner}
    </Link>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: (event: React.MouseEvent) => void;
  active?: boolean;
  activeColor?: "brand" | "success" | "danger";
  children: React.ReactNode;
}

function ActionButton({
  label,
  onClick,
  active = false,
  activeColor = "brand",
  children,
}: ActionButtonProps) {
  const activeRing = {
    brand: "bg-brand-500/90 text-white",
    success: "bg-success/90 text-white",
    danger: "bg-danger/90 text-white",
  }[activeColor];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
        "border border-border bg-bg-elevated/80 text-ink-muted backdrop-blur-md",
        "hover:scale-105 hover:border-border-strong hover:text-ink",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70",
        "active:scale-95",
        active && activeRing,
        active && "border-transparent shadow-glow-soft",
      )}
    >
      {children}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Skeleton companion — sized to match MovieCard precisely so swap-in is seamless.
// -----------------------------------------------------------------------------

export function MovieCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-bg-elevated">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      <div className="px-0.5">
        <div className="h-4 w-3/4 rounded bg-bg-elevated" />
        <div className="mt-1 h-3 w-1/4 rounded bg-bg-elevated/70" />
      </div>
    </div>
  );
}

// Re-export the snapshot/wishlist type alias for consumers that pass a stored
// watchlist item directly (they already match the MovieCardData shape).
export type { WatchlistItem };
