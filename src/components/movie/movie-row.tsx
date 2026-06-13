/**
 * MovieRow — horizontal scroll rail of MovieCards.
 *
 * Used for the "Trending", "Top Rated", "Because you watched ..." sections on
 * the home page and detail pages. Features:
 *  - Smooth `scroll-snap` carousel with momentum scrolling on touch devices.
 *  - Left/right scroll-arrow buttons (desktop only) that scroll by one viewport
 *    width and disable themselves at the start/end of the rail.
 *  - Optional "See all" link in the header.
 *  - Skeleton state matching the cards' aspect ratio.
 *
 * The card sizing is deliberately responsive: 2 cards on phones, scaling up to
 * 6+ on widescreen. The container uses CSS to size each child so the row
 * doesn't need to compute sizes per-card.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/utils/cn";

import { MovieCard, MovieCardSkeleton, type MovieCardData } from "./movie-card";

export interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: MovieCardData[] | undefined;
  /** URL for the "See all" link in the header. Hides the link when omitted. */
  seeAllHref?: string;
  /** Show numeric rank badges on each card (used for trending rails). */
  ranked?: boolean;
  /** Show a loading placeholder rail of N skeleton cards. */
  isLoading?: boolean;
  /** Number of skeletons while loading. */
  skeletonCount?: number;
  className?: string;
  /** Skip lazy-load on the first card (above-the-fold rails). */
  priority?: boolean;
}

export function MovieRow({
  title,
  subtitle,
  movies,
  seeAllHref,
  ranked = false,
  isLoading = false,
  skeletonCount = 8,
  className,
  priority = false,
}: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, movies]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.9 * (direction === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const showEmpty = !isLoading && (!movies || movies.length === 0);

  return (
    <section className={cn("relative", className)} aria-label={title}>
      <header className="mb-3 flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="shrink-0 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
          >
            See all
            <ChevronRight className="ml-0.5 inline-block size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </header>

      <div className="group/row relative">
        {/* Desktop scroll arrows */}
        <ScrollArrow
          direction="left"
          visible={canScrollLeft}
          onClick={() => scrollBy("left")}
        />
        <ScrollArrow
          direction="right"
          visible={canScrollRight}
          onClick={() => scrollBy("right")}
        />

        <div
          ref={scrollRef}
          className={cn(
            "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-4 sm:gap-4 sm:px-6 lg:px-8",
            // Hide native scrollbar while keeping scrollability.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={i} className={cardSizeClass}>
                  <MovieCardSkeleton />
                </div>
              ))
            : null}

          {!isLoading && movies
            ? movies.map((movie, i) => (
                <div key={movie.id} className={cn(cardSizeClass, "snap-start")}>
                  <MovieCard
                    movie={movie}
                    size="lg"
                    rank={ranked ? i + 1 : undefined}
                    priority={priority && i < 4}
                  />
                </div>
              ))
            : null}

          {showEmpty ? (
            <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-ink-muted">
              No titles to show yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Reusable per-card width controlling 2→6 cards-per-viewport responsively. */
const cardSizeClass =
  "w-[44%] shrink-0 sm:w-[30%] md:w-[22%] lg:w-[18%] xl:w-[14.5%]";

interface ScrollArrowProps {
  direction: "left" | "right";
  visible: boolean;
  onClick: () => void;
}

function ScrollArrow({ direction, visible, onClick }: ScrollArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center md:flex",
        "h-12 w-10 rounded-full border border-border bg-bg-elevated/90 text-ink shadow-lg backdrop-blur-md",
        "transition-all duration-300 ease-spring",
        "hover:border-border-strong hover:bg-bg-elevated hover:scale-110",
        "active:scale-95",
        direction === "left" ? "left-2" : "right-2",
        visible
          ? "opacity-0 group-hover/row:opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      {direction === "left" ? (
        <ChevronLeft className="size-5" aria-hidden="true" />
      ) : (
        <ChevronRight className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
