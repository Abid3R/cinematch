/**
 * Movie details page (`/movie/[id]`).
 *
 * Cinematic single-title view. Pulls the full `MovieDetails` payload (with
 * appended `credits`, `videos`, `keywords`, `production_companies`) and lays it
 * out across a backdrop hero, an action row, a two-column body
 * (overview + trailer + cast left, production sidebar right), and a "More like
 * this" rail powered by the local recommendation engine when the user has
 * enough signal, falling back to TMDB's own recommendations otherwise.
 *
 * Side effects:
 *  - Records the view in `useViewHistoryStore` on mount so it feeds back into
 *    "Continue browsing" and personalized recommendations.
 *
 * Resilience:
 *  - Invalid numeric id  -> `notFound()`
 *  - Query error         -> rethrows so the segment's error.tsx renders
 *  - Query loading       -> falls back to the segment's loading.tsx
 *  - Empty optional data -> the corresponding section quietly hides
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Film,
  Globe,
  Languages,
  Play,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import { MovieRow } from "@/components/movie";
import {
  RecommendationSection,
  ScoreBadge,
} from "@/components/recommendation";
import { Button } from "@/components/ui";
import {
  useMovieDetails,
  useMovieTmdbRecommendations,
} from "@/hooks/queries/use-movies";
import { useRankedSimilar } from "@/hooks/queries/use-recommendations";
import { useLikesStore } from "@/store/likes";
import { useRatingsStore } from "@/store/ratings";
import { useViewHistoryStore } from "@/store/view-history";
import { useWatchedStore } from "@/store/watched";
import { useWatchlistStore } from "@/store/watchlist";
import type { ScoredRecommendation } from "@/services/recommendation/types";
import type { Movie, Video } from "@/types/tmdb";
import type {
  RecommendationSection as RecommendationSectionData,
  ScoredMovie,
} from "@/types/recommendation";
import { cn } from "@/utils/cn";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatRuntime,
  formatYear,
} from "@/utils/format";
import { getBackdropUrl, getPosterUrl, getProfileUrl } from "@/utils/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

export default function MovieDetailsPage({ params }: PageProps): JSX.Element {
  const router = useRouter();
  const { id } = use(params);
  const movieId = Number(id);
  if (!Number.isFinite(movieId) || movieId <= 0) notFound();

  const { data: details, isLoading, isError, error } = useMovieDetails(movieId);

  // MovieDetails has `genres` rather than `genre_ids`; the store layer expects
  // the lightweight `Movie` shape, so rebuild it here.
  const movieForStore = useMemo(() => {
    if (!details) return null;
    const { genres, ...rest } = details;
    return {
      ...rest,
      genre_ids: genres?.map((g) => g.id) ?? [],
    } satisfies Movie;
  }, [details]);

  // -- store wiring --------------------------------------------------------
  const recordView = useViewHistoryStore((s) => s.record);
  const inWatchlist = useWatchlistStore((s) => s.has(movieId));
  const toggleWatchlist = useWatchlistStore((s) => s.toggle);
  const isWatched = useWatchedStore((s) => s.has(movieId));
  const toggleWatched = useWatchedStore((s) => s.toggle);
  const likeState = useLikesStore((s) => s.getState(movieId));
  const toggleLike = useLikesStore((s) => s.toggleLike);
  const toggleDislike = useLikesStore((s) => s.toggleDislike);
  const currentRating = useRatingsStore((s) => s.ratingFor(movieId));
  const setRating = useRatingsStore((s) => s.setRating);

  // Record a view exactly once when details arrive.
  useEffect(() => {
    if (!movieForStore) return;
    recordView(movieForStore);
  }, [movieForStore, recordView]);

  // -- recommendations -----------------------------------------------------
  const { data: ranked } = useRankedSimilar(movieId, { limit: 12 });
  const hasRanked = (ranked?.length ?? 0) > 0;
  const { data: tmdbRecs } = useMovieTmdbRecommendations(movieId, {
    enabled: !hasRanked,
  });

  const recommendationSection: RecommendationSectionData | null = useMemo(() => {
    if (ranked && ranked.length > 0) {
      return {
        kind: "recently-similar",
        title: "More like this",
        description: "Tuned to your taste using this title as the anchor.",
        movies: ranked.map(toScoredMovie),
      };
    }
    return null;
  }, [ranked]);

  // -- trailer -------------------------------------------------------------
  const trailerKey = useMemo(() => pickTrailerKey(details?.videos?.results ?? []), [details?.videos?.results]);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // -- error pass-through --------------------------------------------------
  if (isError) throw error;
  if (isLoading || !details) return <></>;

  // -- derived data --------------------------------------------------------
  const backdrop = getBackdropUrl(details.backdrop_path, "original");
  const poster = getPosterUrl(details.poster_path, "xl");
  const directors = (details.credits?.crew ?? []).filter((c) => c.job === "Director");
  const cast = (details.credits?.cast ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 12);
  const keywords = details.keywords?.keywords ?? [];

  return (
    <div className="relative pb-16">
      {/* -------------------------------------------------------------- HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {backdrop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backdrop}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-bg-elevated via-bg to-bg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ENTRANCE_EASE }}
          className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 pb-12 pt-28 sm:px-6 lg:flex-row lg:items-end lg:pb-16 lg:pt-36 lg:px-8"
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-4 top-20 inline-flex items-center gap-1 rounded-full border border-border/60 bg-bg-elevated/60 px-3 py-1.5 text-xs text-ink-muted backdrop-blur-md transition-colors hover:bg-bg-elevated hover:text-ink sm:left-6 lg:left-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </button>

          {poster ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: ENTRANCE_EASE, delay: 0.05 }}
              className="w-40 shrink-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/40 sm:w-48 lg:w-56"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster}
                alt={details.title}
                className="aspect-[2/3] w-full object-cover"
              />
            </motion.div>
          ) : null}

          <div className="flex-1">
            {details.tagline ? (
              <p className="mb-3 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs uppercase tracking-wider text-brand-300">
                {details.tagline}
              </p>
            ) : null}

            <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {details.title}
            </h1>
            {details.original_title !== details.title ? (
              <p className="mt-1 text-sm text-ink-muted">
                Originally: <em>{details.original_title}</em>
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {formatYear(details.release_date)}
              </span>
              {details.runtime ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {formatRuntime(details.runtime)}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
                <span className="font-semibold text-ink">{details.vote_average.toFixed(1)}</span>
                <span className="text-ink-subtle">/ 10</span>
                <span className="text-ink-subtle">({details.vote_count.toLocaleString()})</span>
              </span>
              {details.status ? (
                <span className="rounded-full border border-border/60 bg-bg-elevated/40 px-2 py-0.5 text-xs text-ink-muted">
                  {details.status}
                </span>
              ) : null}
            </div>

            {details.genres.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {details.genres.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center rounded-full border border-border/60 bg-bg-elevated/40 px-3 py-1 text-xs text-ink-muted backdrop-blur-md"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {trailerKey ? (
                <Button onClick={() => setTrailerOpen(true)}>
                  <Play className="mr-1 h-4 w-4 fill-current" />
                  Watch trailer
                </Button>
              ) : null}

              <Button
                variant={inWatchlist ? "default" : "outline"}
                onClick={() => movieForStore && toggleWatchlist(movieForStore)}
              >
                {inWatchlist ? (
                  <BookmarkCheck className="mr-1 h-4 w-4" />
                ) : (
                  <Bookmark className="mr-1 h-4 w-4" />
                )}
                {inWatchlist ? "In watchlist" : "Add to watchlist"}
              </Button>

              <Button
                variant={isWatched ? "default" : "outline"}
                onClick={() => movieForStore && toggleWatched(movieForStore)}
                aria-pressed={isWatched}
              >
                {isWatched ? (
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                ) : (
                  <Circle className="mr-1 h-4 w-4" />
                )}
                {isWatched ? "Watched" : "Mark as watched"}
              </Button>

              <Button
                variant={likeState === "liked" ? "default" : "outline"}
                onClick={() => movieForStore && toggleLike(movieForStore)}
                aria-pressed={likeState === "liked"}
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                {likeState === "liked" ? "Liked" : "Like"}
              </Button>

              <Button
                variant={likeState === "disliked" ? "default" : "outline"}
                onClick={() => movieForStore && toggleDislike(movieForStore)}
                aria-pressed={likeState === "disliked"}
              >
                <ThumbsDown className="mr-1 h-4 w-4" />
                {likeState === "disliked" ? "Not for me" : "Dislike"}
              </Button>

              <StarRater
                value={currentRating}
                onChange={(val) => movieForStore && setRating(movieForStore, val)}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* -------------------------------------------------------------- BODY */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Left column: overview, trailer, cast */}
          <div className="space-y-10">
            {details.overview ? (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Overview
                </h2>
                <p className="mt-3 text-base leading-relaxed text-ink/90 sm:text-lg">
                  {details.overview}
                </p>
              </div>
            ) : null}

            {directors.length > 0 ? (
              <div className="flex flex-wrap items-baseline gap-2 text-sm text-ink-muted">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {directors.length > 1 ? "Directors" : "Director"}
                </span>
                <span className="text-ink">
                  {directors.map((d) => d.name).join(", ")}
                </span>
              </div>
            ) : null}

            {cast.length > 0 ? (
              <div>
                <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Top cast
                </h2>
                <div className="mt-3 flex gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
                  {cast.map((member) => {
                    const profile = getProfileUrl(member.profile_path, "md");
                    return (
                      <div
                        key={`${member.id}-${member.order}`}
                        className="w-28 shrink-0"
                      >
                        <div className="aspect-[2/3] overflow-hidden rounded-xl border border-border/60 bg-bg-elevated">
                          {profile ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={profile}
                              alt={member.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-subtle">
                              <Film className="h-6 w-6" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-1 text-sm font-medium text-ink">
                          {member.name}
                        </p>
                        {member.character ? (
                          <p className="line-clamp-1 text-xs text-ink-muted">
                            {member.character}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {keywords.length > 0 ? (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Keywords
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {keywords.slice(0, 24).map((k) => (
                    <Link
                      key={k.id}
                      href={`/discover?keyword=${encodeURIComponent(k.name)}`}
                      className="rounded-full border border-border/60 bg-bg-elevated/40 px-3 py-1 text-xs text-ink-muted backdrop-blur-md transition-colors hover:border-brand-500/40 hover:text-brand-300"
                    >
                      {k.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right column: production sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 backdrop-blur-md">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SidebarRow label="Status" value={details.status} />
                <SidebarRow
                  label="Released"
                  value={details.release_date ? formatDate(details.release_date) : null}
                />
                <SidebarRow
                  label="Runtime"
                  value={details.runtime ? formatRuntime(details.runtime) : null}
                />
                <SidebarRow
                  label="Budget"
                  value={details.budget > 0 ? formatCurrency(details.budget) : null}
                />
                <SidebarRow
                  label="Revenue"
                  value={details.revenue > 0 ? formatCurrency(details.revenue) : null}
                />
                {details.budget > 0 && details.revenue > 0 ? (
                  <SidebarRow
                    label="ROI"
                    value={formatPercent(details.revenue / details.budget - 1)}
                  />
                ) : null}
                <SidebarRow
                  label="Language"
                  value={
                    details.spoken_languages?.[0]?.english_name ??
                    details.original_language?.toUpperCase()
                  }
                  icon={Languages}
                />
                {details.homepage ? (
                  <SidebarRow
                    label="Homepage"
                    icon={Globe}
                    value={
                      <a
                        href={details.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-300 hover:text-brand-200"
                      >
                        Visit site
                      </a>
                    }
                  />
                ) : null}
              </dl>
            </div>

            {details.production_companies && details.production_companies.length > 0 ? (
              <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 backdrop-blur-md">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Production
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink/90">
                  {details.production_companies.slice(0, 6).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3">
                      <span className="line-clamp-1">{c.name}</span>
                      {c.origin_country ? (
                        <span className="shrink-0 text-xs text-ink-subtle">
                          {c.origin_country}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {currentRating ? (
              <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 backdrop-blur-md">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Your rating
                </h2>
                <div className="mt-3 flex items-center gap-3">
                  <ScoreBadge score={currentRating / 10} size="md" noTooltip />
                  <p className="text-sm text-ink-muted">
                    You rated this {currentRating}/10
                  </p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {/* ------------------------------------------------------- RECS RAIL */}
      {recommendationSection ? (
        <section className="mx-auto max-w-7xl">
          <RecommendationSection
            section={recommendationSection}
            seeAllHref="/recommendations"
            noSpotlight
          />
        </section>
      ) : tmdbRecs && tmdbRecs.results.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MovieRow title="You might also like" movies={tmdbRecs.results} />
        </section>
      ) : null}

      {/* ------------------------------------------------------ TRAILER MODAL */}
      <AnimatePresence>
        {trailerOpen && trailerKey ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setTrailerOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Trailer"
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: ENTRANCE_EASE }}
              className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setTrailerOpen(false)}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-bg-elevated/80 text-ink backdrop-blur-md transition-colors hover:bg-bg-elevated"
                aria-label="Close trailer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title={`${details.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Adapters & sub-components
// =============================================================================

/**
 * Map engine `ScoredRecommendation` -> UI `ScoredMovie`.
 *
 * The engine and the presentation layer evolved separately:
 *  - engine score is 0..100, no `total` on the breakdown, kinds use snake_case
 *  - UI expects 0..1 score totals and kebab-case reason kinds
 * Doing the translation at the boundary keeps both sides idiomatic.
 */
function toScoredMovie(rec: ScoredRecommendation): ScoredMovie {
  return {
    movie: rec.movie,
    score: { ...rec.breakdown, total: rec.score / 100 },
    reasons: rec.reasons.map((r) => ({
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

/** Prefer the first official YouTube Trailer, fall back to any Trailer/Teaser. */
function pickTrailerKey(videos: Video[]): string | null {
  const youtube = videos.filter((v) => v.site === "YouTube");
  const officialTrailer = youtube.find((v) => v.type === "Trailer" && v.official);
  if (officialTrailer) return officialTrailer.key;
  const anyTrailer = youtube.find((v) => v.type === "Trailer");
  if (anyTrailer) return anyTrailer.key;
  const teaser = youtube.find((v) => v.type === "Teaser");
  return teaser?.key ?? null;
}

interface SidebarRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

function SidebarRow({ label, value, icon: Icon }: SidebarRowProps) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-ink-muted">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </dt>
      <dd className="max-w-[60%] text-right text-ink">{value}</dd>
    </div>
  );
}

interface StarRaterProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

/**
 * Compact 5-star (10-point) rater. Each star covers two points; clicking the
 * left half submits an odd score, the right half submits the even one. The
 * underlying store snaps to a 0.5 step regardless.
 */
function StarRater({ value, onChange }: StarRaterProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-bg-elevated/40 px-2 py-1.5 backdrop-blur-md"
      onMouseLeave={() => setHover(null)}
      role="radiogroup"
      aria-label="Rate this movie"
    >
      {[1, 2, 3, 4, 5].map((idx) => {
        const fullThreshold = idx * 2;
        const halfThreshold = fullThreshold - 1;
        const isFull = display >= fullThreshold;
        const isHalf = !isFull && display >= halfThreshold;
        return (
          <div key={idx} className="relative inline-flex">
            <button
              type="button"
              className="absolute inset-y-0 left-0 z-10 w-1/2"
              onMouseEnter={() => setHover(halfThreshold)}
              onClick={() => onChange(halfThreshold)}
              aria-label={`Rate ${halfThreshold} out of 10`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 z-10 w-1/2"
              onMouseEnter={() => setHover(fullThreshold)}
              onClick={() => onChange(fullThreshold)}
              aria-label={`Rate ${fullThreshold} out of 10`}
            />
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                isFull
                  ? "fill-warning text-warning"
                  : isHalf
                    ? "fill-warning/60 text-warning"
                    : "text-ink-subtle",
              )}
              aria-hidden="true"
            />
          </div>
        );
      })}
      <span className="ml-1 min-w-8 text-right text-xs tabular-nums text-ink-muted">
        {display ? `${display}/10` : "Rate"}
      </span>
    </div>
  );
}
