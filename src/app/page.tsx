/**
 * Home page.
 *
 * The marquee of the app: a rotating hero banner pulled from trending, then a
 * stack of horizontal rails. Personalized "Picks For You" only renders when
 * the recommender has enough signal to produce results (cold start hides it
 * gracefully). Rails are independent queries so a slow endpoint never blocks
 * the rest of the page.
 */

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MovieBanner, MovieBannerSkeleton, MovieRow } from "@/components/movie";
import { Button } from "@/components/ui";
import {
  useNowPlaying,
  usePersonalizedRecommendations,
  usePopular,
  useTopRated,
  useTrending,
  useUpcoming,
} from "@/hooks/queries";
import type { Movie } from "@/types/tmdb";

// Rotate the hero every 8s — long enough to read, short enough to feel alive.
const HERO_ROTATION_MS = 8000;
const HERO_POOL_SIZE = 5;

export default function HomePage(): JSX.Element {
  // ---------------------------------------------------------------------------
  // Hero rotation
  // ---------------------------------------------------------------------------
  const trendingQuery = useTrending("week");
  const heroPool = useMemo<Movie[]>(
    () =>
      (trendingQuery.data?.results ?? [])
        .filter((m) => m.backdrop_path && m.overview)
        .slice(0, HERO_POOL_SIZE),
    [trendingQuery.data?.results],
  );

  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    if (heroPool.length < 2) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroPool.length);
    }, HERO_ROTATION_MS);
    return () => window.clearInterval(id);
  }, [heroPool.length]);

  // Keep the index valid if the pool shrinks (e.g. on refetch).
  useEffect(() => {
    if (heroIndex >= heroPool.length) setHeroIndex(0);
  }, [heroIndex, heroPool.length]);

  const heroMovie = heroPool[heroIndex];

  // ---------------------------------------------------------------------------
  // Rails
  // ---------------------------------------------------------------------------
  const popularQuery = usePopular();
  const topRatedQuery = useTopRated();
  const nowPlayingQuery = useNowPlaying();
  const upcomingQuery = useUpcoming();
  const picksQuery = usePersonalizedRecommendations({ limit: 12 });

  // Personalized rail is hidden when the recommender returned nothing —
  // showing an empty rail to a cold-start user is worse than just hiding it.
  const personalizedMovies = useMemo<Movie[]>(
    () => picksQuery.data?.map((r) => r.movie) ?? [],
    [picksQuery.data],
  );

  return (
    <div className="relative">
      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative">
        {heroMovie ? (
          <MovieBanner movie={heroMovie} priority />
        ) : (
          <MovieBannerSkeleton />
        )}

        {/* Hero dots */}
        {heroPool.length > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center sm:bottom-10">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-2 backdrop-blur-md">
              {heroPool.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  aria-label={`Show ${m.title}`}
                  aria-current={i === heroIndex}
                  onClick={() => setHeroIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === heroIndex
                      ? "w-8 bg-brand"
                      : "w-2 bg-ink/30 hover:bg-ink/60"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Rails                                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="mx-auto max-w-[1400px] space-y-12 px-4 py-12 sm:px-6 lg:space-y-16 lg:px-10 lg:py-16">
        {/* Personalized — only when we have results */}
        {personalizedMovies.length > 0 ? (
          <PersonalizedRail movies={personalizedMovies} />
        ) : null}

        <MovieRow
          title="Trending This Week"
          subtitle="What everyone's watching right now"
          movies={trendingQuery.data?.results}
          isLoading={trendingQuery.isLoading}
          seeAllHref="/discover?sort=popularity.desc"
          ranked
          priority
        />

        <MovieRow
          title="Popular Right Now"
          subtitle="Crowd-pleasers worth your evening"
          movies={popularQuery.data?.results}
          isLoading={popularQuery.isLoading}
          seeAllHref="/discover?sort=popularity.desc"
        />

        <MovieRow
          title="Top Rated"
          subtitle="The films audiences keep coming back to"
          movies={topRatedQuery.data?.results}
          isLoading={topRatedQuery.isLoading}
          seeAllHref="/discover?sort=vote_average.desc"
        />

        <MovieRow
          title="Now Playing"
          subtitle="In theaters this week"
          movies={nowPlayingQuery.data?.results}
          isLoading={nowPlayingQuery.isLoading}
          seeAllHref="/discover?sort=primary_release_date.desc"
        />

        <MovieRow
          title="Coming Soon"
          subtitle="On the horizon"
          movies={upcomingQuery.data?.results}
          isLoading={upcomingQuery.isLoading}
          seeAllHref="/discover?sort=primary_release_date.asc"
        />

        {/* CTA */}
        <CallToAction />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Personalized rail — wraps MovieRow with a brand-tinted frame
// ---------------------------------------------------------------------------

function PersonalizedRail({ movies }: { movies: Movie[] }): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 via-surface/40 to-transparent p-1"
    >
      <div className="rounded-[1.4rem] bg-bg/40 p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            For you
          </span>
        </div>
        <MovieRow
          title="Picks For You"
          subtitle="Tailored from your taste signals"
          movies={movies}
          seeAllHref="/recommendations"
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// CTA card at the bottom of the page
// ---------------------------------------------------------------------------

function CallToAction(): JSX.Element {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface/80 via-surface/40 to-brand/10 p-8 sm:p-12"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Get recommendations that <span className="text-gradient">actually fit</span>.
        </h2>
        <p className="mt-4 text-base text-ink-muted sm:text-lg">
          Tell CineMatch what you love and we&apos;ll do the rest. The more you
          rate, like, and add to your watchlist, the sharper your picks get.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
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
    </motion.section>
  );
}
