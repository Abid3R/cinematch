/**
 * RecommendationSection — themed wrapper for one of the engine's curated rails.
 *
 * Renders a header (kind-specific icon + title + description) followed by a
 * `MovieRow` of the section's `ScoredMovie[]`. The score badge and reason
 * chips for the top-scored title are surfaced as a "Spotlight" callout
 * beneath the header so the experience feels editorial rather than mechanical.
 *
 * Section "kinds" map to subtle accent tones:
 *  - `for-you`            -> brand
 *  - `because-you-liked`  -> brand
 *  - `hidden-gems`        -> success
 *  - `trending-for-you`   -> danger
 *  - `director-picks`     -> warning
 *  - `actor-picks`        -> info
 *  - `genre-picks`        -> brand
 *  - `recently-similar`   -> brand
 */
"use client";

import Link from "next/link";
import {
  Clapperboard,
  Compass,
  Film,
  Flame,
  Gem,
  Heart,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MovieRow } from "@/components/movie";
import { cn } from "@/utils/cn";
import type {
  RecommendationSection as RecommendationSectionData,
  RecommendationSectionKind,
} from "@/types/recommendation";

import { ReasonChips } from "./reason-chips";
import { ScoreBadge } from "./score-badge";

export interface RecommendationSectionProps {
  section: RecommendationSectionData;
  /** Optional "See all" link target. */
  seeAllHref?: string;
  /** Show numeric rank badges on each card. */
  ranked?: boolean;
  /** Hide the top-pick spotlight callout above the rail. */
  noSpotlight?: boolean;
  isLoading?: boolean;
  className?: string;
}

const KIND_META: Record<
  RecommendationSectionKind,
  { icon: LucideIcon; tone: string; label: string }
> = {
  "for-you": { icon: Sparkles, tone: "brand", label: "For you" },
  "because-you-liked": { icon: Heart, tone: "brand", label: "Because you liked" },
  "hidden-gems": { icon: Gem, tone: "success", label: "Hidden gems" },
  "trending-for-you": { icon: Flame, tone: "danger", label: "Trending for you" },
  "director-picks": { icon: Clapperboard, tone: "warning", label: "Director picks" },
  "actor-picks": { icon: User, tone: "info", label: "Actor spotlight" },
  "genre-picks": { icon: Film, tone: "brand", label: "Genre picks" },
  "recently-similar": { icon: Wand2, tone: "brand", label: "More like this" },
};

const TONE_CLASSES: Record<string, { border: string; bg: string; text: string }> = {
  brand: {
    border: "border-brand-500/30",
    bg: "bg-brand-500/10",
    text: "text-brand-300",
  },
  success: { border: "border-success/30", bg: "bg-success/10", text: "text-success" },
  danger: { border: "border-danger/30", bg: "bg-danger/10", text: "text-danger" },
  warning: { border: "border-warning/30", bg: "bg-warning/10", text: "text-warning" },
  info: { border: "border-info/30", bg: "bg-info/10", text: "text-info" },
};

export function RecommendationSection({
  section,
  seeAllHref,
  ranked = false,
  noSpotlight = false,
  isLoading = false,
  className,
}: RecommendationSectionProps) {
  const meta = KIND_META[section.kind] ?? {
    icon: Compass,
    tone: "brand",
    label: section.title,
  };
  const tone = TONE_CLASSES[meta.tone] ?? TONE_CLASSES.brand;
  const Icon = meta.icon;
  const movies = section.movies.map((s) => s.movie);
  const spotlight = section.movies[0];

  return (
    <section className={cn("flex flex-col gap-4", className)} aria-label={section.title}>
      <header className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-xl border backdrop-blur-md",
                tone.border,
                tone.bg,
                tone.text,
              )}
              aria-hidden="true"
            >
              <Icon className="size-4" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {section.title}
              </h2>
              {section.description ? (
                <p className="mt-0.5 text-sm text-ink-muted">{section.description}</p>
              ) : null}
            </div>
          </div>
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="shrink-0 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
            >
              Explore all
            </Link>
          ) : null}
        </div>

        {/* Spotlight pick — top scored title with its reasons surfaced inline. */}
        {!noSpotlight && spotlight ? (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-bg-elevated/40 px-4 py-3 backdrop-blur-md",
              tone.border,
            )}
          >
            <ScoreBadge score={spotlight.score} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-ink-muted">
                Top pick
              </p>
              <Link
                href={`/movie/${spotlight.movie.id}`}
                className="line-clamp-1 text-sm font-semibold text-ink hover:text-brand-300"
              >
                {spotlight.movie.title}
              </Link>
            </div>
            <ReasonChips
              reasons={spotlight.reasons}
              max={3}
              variant="scroll"
              size="sm"
              className="max-w-full sm:max-w-md"
            />
          </div>
        ) : null}
      </header>

      <MovieRow
        title=""
        movies={movies}
        ranked={ranked}
        isLoading={isLoading}
        skeletonCount={8}
        className="!mt-0 [&>header]:hidden"
      />
    </section>
  );
}
