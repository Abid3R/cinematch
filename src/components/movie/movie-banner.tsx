/**
 * MovieBanner — full-bleed hero used on the home page and movie details.
 *
 * Renders the backdrop image with a layered gradient overlay (radial + linear)
 * that keeps the foreground text legible without needing a separate scrim
 * mesh. Above the backdrop:
 *  - Title (display weight)
 *  - Tagline / overview (truncated, 2-line clamp on mobile, 3 on desktop)
 *  - Meta row: year • rating • genres
 *  - Primary CTA: "Watch trailer" or "View details"
 *  - Secondary CTA: "Add to watchlist" (wired to Zustand)
 *
 * Both an above-the-fold `priority` mode and a "Featured" badge are exposed
 * for the home hero. The home page rotates banners every 8s by re-mounting
 * with a different `movie` prop; the AnimatePresence wrapper handles fade.
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Info,
  Play,
  Sparkles,
  Star,
} from "lucide-react";

import { DEFAULT_GENRE_MAP } from "@/constants/tmdb";
import { useWatchlistStore } from "@/store";
import type { Movie } from "@/types/tmdb";
import { getBackdropUrl } from "@/utils/image";
import {
  formatList,
  formatRating,
  formatYear,
  truncate,
} from "@/utils/format";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

export interface MovieBannerProps {
  movie: Movie;
  /** Optional "Featured" / "Editor's pick" pill above the title. */
  badge?: string;
  /** Above-the-fold? Skips lazy-loading the backdrop. */
  priority?: boolean;
  /** Compact mode for movie-detail page (less vertical breathing room). */
  variant?: "hero" | "detail";
  /** Hide the secondary watchlist CTA. */
  noActions?: boolean;
  className?: string;
}

export function MovieBanner({
  movie,
  badge,
  priority = true,
  variant = "hero",
  noActions = false,
  className,
}: MovieBannerProps) {
  const isInWatchlist = useWatchlistStore((s) =>
    s.items.some((item) => item.movieId === movie.id),
  );

  const onToggleWatchlist = () => {
    useWatchlistStore.getState().toggle(movie);
  };

  const year = formatYear(movie.release_date);
  const rating = formatRating(movie.vote_average);
  const hasRating = (movie.vote_average ?? 0) > 0;
  const genres = (movie.genre_ids ?? [])
    .map((id) => DEFAULT_GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <section
      className={cn(
        "relative isolate w-full overflow-hidden",
        variant === "hero" ? "min-h-[70vh]" : "min-h-[55vh]",
        className,
      )}
      aria-label={`Featured: ${movie.title}`}
    >
      {/* Backdrop — animated cross-fade when the movie changes. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={getBackdropUrl(movie.backdrop_path, "original")}
            alt=""
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover"
            unoptimized={!movie.backdrop_path}
          />
        </motion.div>
      </AnimatePresence>

      {/* Layered overlays — linear darkens the bottom, radial fades to brand glow. */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/30 to-transparent" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(255,45,85,0.18), transparent 50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 pt-32 sm:px-6 sm:pb-16 sm:pt-40 lg:px-8 lg:pb-20 lg:pt-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="max-w-2xl"
          >
            {badge ? (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300 backdrop-blur-md">
                <Sparkles className="size-3" aria-hidden="true" />
                {badge}
              </div>
            ) : null}

            <h1
              className={cn(
                "font-display font-bold tracking-tight text-ink drop-shadow-lg",
                variant === "hero"
                  ? "text-4xl sm:text-5xl lg:text-7xl"
                  : "text-3xl sm:text-4xl lg:text-5xl",
              )}
            >
              {movie.title}
            </h1>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
              {year ? <span>{year}</span> : null}
              {hasRating ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
                  <span className="font-medium text-ink">{rating}</span>
                </span>
              ) : null}
              {genres.length > 0 ? <span>{formatList(genres)}</span> : null}
            </div>

            {/* Overview */}
            {movie.overview ? (
              <p
                className={cn(
                  "mt-5 text-base leading-relaxed text-ink-muted",
                  variant === "hero"
                    ? "line-clamp-3 sm:text-lg"
                    : "line-clamp-4",
                )}
              >
                {truncate(movie.overview, 280)}
              </p>
            ) : null}

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="primary">
                <Link href={`/movie/${movie.id}`} aria-label={`View details for ${movie.title}`}>
                  <Play className="fill-current" aria-hidden="true" />
                  Watch trailer
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/movie/${movie.id}`}>
                  <Info aria-hidden="true" />
                  More info
                </Link>
              </Button>
              {!noActions ? (
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  onClick={onToggleWatchlist}
                  aria-label={
                    isInWatchlist
                      ? "Remove from watchlist"
                      : "Add to watchlist"
                  }
                >
                  {isInWatchlist ? (
                    <>
                      <BookmarkCheck aria-hidden="true" />
                      In watchlist
                    </>
                  ) : (
                    <>
                      <Bookmark aria-hidden="true" />
                      Watchlist
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Skeleton companion — used during the initial home-page fetch.
// -----------------------------------------------------------------------------

export function MovieBannerSkeleton({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "detail";
  className?: string;
}) {
  return (
    <section
      aria-hidden="true"
      className={cn(
        "relative isolate w-full overflow-hidden bg-bg-elevated",
        variant === "hero" ? "min-h-[70vh]" : "min-h-[55vh]",
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/30" />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end gap-4 px-4 pb-12 pt-32 sm:px-6 sm:pb-16 sm:pt-40 lg:px-8 lg:pb-20 lg:pt-48">
        <div className="h-6 w-32 rounded-full bg-bg-subtle/80" />
        <div className="h-14 w-3/4 rounded-lg bg-bg-subtle/80 sm:h-16 lg:h-20" />
        <div className="h-4 w-1/3 rounded bg-bg-subtle/70" />
        <div className="h-4 w-2/3 rounded bg-bg-subtle/70" />
        <div className="mt-4 flex gap-3">
          <div className="h-12 w-36 rounded-lg bg-bg-subtle/80" />
          <div className="h-12 w-32 rounded-lg bg-bg-subtle/70" />
        </div>
      </div>
    </section>
  );
}
