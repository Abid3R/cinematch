/**
 * Recommendations page.
 *
 * The deep-dive surface for the personalization engine. Where `/` shows a
 * single "Picks For You" rail, this page composes the full editorial set:
 * "For you", "Because you liked …", "Hidden gems", "Director picks",
 * "Actor spotlight", "Genre picks". Each rail is derived from a single shared
 * personalized pool (so we don't pay six round-trips) plus one dedicated
 * hidden-gems pass and one similar-titles pass anchored on the most recently
 * liked movie.
 *
 * Cold-start: when the user has zero signals, we hide every rail and show a
 * single onboarding CTA card. Otherwise we render what the engine can fill
 * and quietly drop any rail with no results.
 */

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { RecommendationSection } from "@/components/recommendation";
import { Button } from "@/components/ui";
import {
  useHiddenGemRecommendations,
  usePersonalizedRecommendations,
  useRankedSimilar,
  useUserProfile,
} from "@/hooks/queries";
import { useLikesStore } from "@/store/likes";
import { cn } from "@/utils/cn";
import type {
  RecommendationReason as UIRecommendationReason,
  RecommendationSection as UIRecommendationSection,
  ScoredMovie,
} from "@/types/recommendation";
import type { ScoredRecommendation } from "@/services/recommendation/types";

const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

// Pool the personalized rail is sliced from. Big enough to feed the partition
// rails (director / actor / genre) without exhausting the candidate set.
const SHARED_POOL_LIMIT = 60;
const PARTITION_LIMIT = 14;
const HEADLINE_LIMIT = 18;
const HIDDEN_GEM_LIMIT = 18;
const SIMILAR_LIMIT = 18;

export default function RecommendationsPage(): JSX.Element {
  // ---------------------------------------------------------------------------
  // Data sources
  // ---------------------------------------------------------------------------
  const { profile, isLoading: profileLoading } = useUserProfile();
  const signalCount = profile.signalCount;
  const hasSignals = signalCount > 0;

  const personalizedQuery = usePersonalizedRecommendations({
    limit: SHARED_POOL_LIMIT,
    enabled: hasSignals,
  });
  const hiddenGemsQuery = useHiddenGemRecommendations({
    limit: HIDDEN_GEM_LIMIT,
    enabled: hasSignals,
  });

  // Pick the most recent liked movie as the "because you liked" anchor.
  const likedItems = useLikesStore((s) => s.items);
  const anchorLike = useMemo(() => {
    const liked = likedItems
      .filter((item) => item.state === "liked")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return liked[0];
  }, [likedItems]);

  const similarQuery = useRankedSimilar(anchorLike?.movieId ?? 0, {
    enabled: hasSignals && Boolean(anchorLike),
    limit: SIMILAR_LIMIT,
  });

  // ---------------------------------------------------------------------------
  // Top weighted entities — used to label the partition rails
  // ---------------------------------------------------------------------------
  const topDirector = useMemo(
    () => pickTopWeighted(profile.directorWeights, profile.directorNames),
    [profile.directorWeights, profile.directorNames],
  );
  const topActor = useMemo(
    () => pickTopWeighted(profile.actorWeights, profile.actorNames),
    [profile.actorWeights, profile.actorNames],
  );
  const topGenre = useMemo(
    () => pickTopWeighted(profile.genreWeights, profile.genreNames),
    [profile.genreWeights, profile.genreNames],
  );

  // ---------------------------------------------------------------------------
  // Derived rails
  // ---------------------------------------------------------------------------
  const sharedPool = personalizedQuery.data ?? [];

  const sections = useMemo<UIRecommendationSection[]>(() => {
    const out: UIRecommendationSection[] = [];

    if (sharedPool.length > 0) {
      out.push({
        kind: "for-you",
        title: "For you",
        description: "Top picks tuned to your taste signals",
        movies: sharedPool.slice(0, HEADLINE_LIMIT).map(toScoredMovie),
      });
    }

    if (anchorLike && (similarQuery.data?.length ?? 0) > 0) {
      out.push({
        kind: "because-you-liked",
        title: `Because you liked ${anchorLike.movie.title}`,
        description: "Closely matched on tone, cast, and crew",
        movies: (similarQuery.data ?? []).map(toScoredMovie),
        anchor: {
          kind: "movie",
          id: anchorLike.movieId,
          name: anchorLike.movie.title,
        },
      });
    }

    if ((hiddenGemsQuery.data?.length ?? 0) > 0) {
      out.push({
        kind: "hidden-gems",
        title: "Hidden gems",
        description: "Under-the-radar titles that match your profile",
        movies: (hiddenGemsQuery.data ?? []).map(toScoredMovie),
      });
    }

    if (topDirector && sharedPool.length > 0) {
      const sorted = [...sharedPool].sort(
        (a, b) => b.breakdown.director - a.breakdown.director,
      );
      const movies = sorted
        .filter((rec) => rec.breakdown.director > 0)
        .slice(0, PARTITION_LIMIT)
        .map(toScoredMovie);
      if (movies.length >= 4) {
        out.push({
          kind: "director-picks",
          title: `From directors you love`,
          description: `Inspired by ${topDirector.name} and others in your rotation`,
          movies,
          anchor: { kind: "person", id: topDirector.id, name: topDirector.name },
        });
      }
    }

    if (topActor && sharedPool.length > 0) {
      const sorted = [...sharedPool].sort(
        (a, b) => b.breakdown.actor - a.breakdown.actor,
      );
      const movies = sorted
        .filter((rec) => rec.breakdown.actor > 0)
        .slice(0, PARTITION_LIMIT)
        .map(toScoredMovie);
      if (movies.length >= 4) {
        out.push({
          kind: "actor-picks",
          title: `Starring talent you keep watching`,
          description: `Spotlight on ${topActor.name} and other favorites`,
          movies,
          anchor: { kind: "person", id: topActor.id, name: topActor.name },
        });
      }
    }

    if (topGenre && sharedPool.length > 0) {
      const sorted = [...sharedPool].sort(
        (a, b) => b.breakdown.genre - a.breakdown.genre,
      );
      const movies = sorted
        .filter((rec) => rec.breakdown.genre > 0)
        .slice(0, PARTITION_LIMIT)
        .map(toScoredMovie);
      if (movies.length >= 4) {
        out.push({
          kind: "genre-picks",
          title: `More ${topGenre.name}`,
          description: `Your most-watched genre, refreshed`,
          movies,
          anchor: { kind: "genre", id: topGenre.id, name: topGenre.name },
        });
      }
    }

    return out;
  }, [
    sharedPool,
    similarQuery.data,
    hiddenGemsQuery.data,
    anchorLike,
    topDirector,
    topActor,
    topGenre,
  ]);

  const anyLoading =
    profileLoading ||
    personalizedQuery.isLoading ||
    hiddenGemsQuery.isLoading ||
    similarQuery.isLoading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <PageHeader signalCount={signalCount} />

      {!hasSignals ? (
        <ColdStartCard />
      ) : sections.length === 0 && !anyLoading ? (
        <EmptyState />
      ) : (
        <div className="mt-10 space-y-14 lg:space-y-16">
          {sections.map((section, idx) => (
            <motion.div
              key={`${section.kind}-${section.anchor?.id ?? idx}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                ease: ENTRANCE_EASE,
                delay: Math.min(idx * 0.05, 0.2),
              }}
            >
              <RecommendationSection
                section={section}
                ranked={section.kind === "for-you"}
                noSpotlight={section.kind === "because-you-liked"}
              />
            </motion.div>
          ))}

          {anyLoading && sections.length === 0 ? (
            <SectionStackSkeleton />
          ) : null}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Header
// =============================================================================

function PageHeader({ signalCount }: { signalCount: number }): JSX.Element {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: ENTRANCE_EASE }}
      className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 via-surface/40 to-transparent p-6 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
          <Wand2 className="h-3.5 w-3.5" />
          Personalized
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Recommendations <span className="text-gradient">made for you</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">
          A curated stack built from your likes, watchlist, ratings, and the
          genres you picked in onboarding. The more you rate and like, the
          sharper your picks get.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-bg-elevated/60 px-3 py-1">
            <Sparkles className="h-3 w-3 text-brand" />
            {signalCount === 0
              ? "No signals yet"
              : `${signalCount} signal${signalCount === 1 ? "" : "s"} feeding the engine`}
          </span>
        </div>
      </div>
    </motion.header>
  );
}

// =============================================================================
// Cold start
// =============================================================================

function ColdStartCard(): JSX.Element {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: ENTRANCE_EASE, delay: 0.1 }}
      className="mt-10 overflow-hidden rounded-3xl border border-border/60 bg-surface/60 p-8 backdrop-blur-xl sm:p-12"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tell us a few things you love.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
            We need a handful of signals before the engine can find titles
            you&apos;ll actually want to watch. Pick a few genres, like a few
            movies, and the rails will fill in.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/onboarding">
                Start onboarding
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/discover">Browse the catalog</Link>
            </Button>
          </div>
        </div>

        <ul className="space-y-3 text-sm text-ink-muted">
          {[
            { label: "Pick 5+ favorite genres", weight: "Strong base signal" },
            { label: "Like a few movies", weight: "Sharpens cast and crew" },
            { label: "Rate what you've watched", weight: "Fine-tunes the rest" },
          ].map((step, idx) => (
            <li
              key={step.label}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-bg-elevated/40 px-4 py-3"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-xs font-bold text-brand">
                {idx + 1}
              </span>
              <div>
                <p className="font-medium text-ink">{step.label}</p>
                <p className="text-xs text-ink-subtle">{step.weight}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

// =============================================================================
// Empty state — has signals but engine found nothing
// =============================================================================

function EmptyState(): JSX.Element {
  return (
    <div
      className={cn(
        "mt-10 flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-surface/40 px-8 py-16 text-center backdrop-blur-md",
      )}
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-bg-elevated text-ink-muted">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-semibold">
        We need a little more to go on.
      </h2>
      <p className="max-w-md text-sm text-ink-muted">
        Like or rate a few more titles and the rails will populate. In the
        meantime, browsing Discover is the fastest way to feed the engine.
      </p>
      <Button asChild className="mt-2">
        <Link href="/discover">Open Discover</Link>
      </Button>
    </div>
  );
}

// =============================================================================
// Skeleton stack — shown while every rail is still loading
// =============================================================================

function SectionStackSkeleton(): JSX.Element {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-14">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-bg-elevated" />
              <div className="space-y-2">
                <div className="h-5 w-48 rounded bg-bg-elevated" />
                <div className="h-3 w-72 rounded bg-bg-elevated/70" />
              </div>
            </div>
          </div>
          <div className="flex gap-4 overflow-hidden px-4 sm:px-6 lg:px-8">
            {Array.from({ length: 8 }).map((__, j) => (
              <div
                key={j}
                className="aspect-[2/3] w-40 shrink-0 rounded-xl bg-bg-elevated/70 sm:w-44 lg:w-48"
              />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading recommendations…</span>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Pick the highest-weighted entity in a Map, returning both id and display
 * name. Skips non-positive weights so we never label a rail with an entity
 * the user actively dislikes.
 */
function pickTopWeighted(
  weights: Map<number, number>,
  names: Map<number, string>,
): { id: number; name: string; weight: number } | null {
  let bestId: number | null = null;
  let bestWeight = -Infinity;
  for (const [id, weight] of weights) {
    if (weight > bestWeight) {
      bestWeight = weight;
      bestId = id;
    }
  }
  if (bestId === null || bestWeight <= 0) return null;
  const name = names.get(bestId);
  if (!name) return null;
  return { id: bestId, name, weight: bestWeight };
}

/**
 * Adapter: engine `ScoredRecommendation` → UI `ScoredMovie`.
 *
 * The engine reports `score` as 0..100 with a flat breakdown; the UI badge
 * expects `score.total` in 0..1 alongside the same breakdown. Reason kinds
 * use snake_case on the engine side and kebab-case on the UI side.
 */
function toScoredMovie(rec: ScoredRecommendation): ScoredMovie {
  return {
    movie: rec.movie,
    score: { ...rec.breakdown, total: rec.score / 100 },
    reasons: rec.reasons.map((r): UIRecommendationReason => ({
      ...r,
      kind:
        r.kind === "popular"
          ? "trending"
          : r.kind === "hidden_gem"
            ? "hidden-gem"
            : r.kind,
    })),
  };
}
