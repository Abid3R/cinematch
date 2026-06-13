/**
 * Onboarding route — cold-start preference capture.
 *
 * Four-step wizard that seeds the recommendation engine before the user has
 * any watchlist / like / rating data:
 *
 *   1. Genres    — chip grid from `useMovieGenres`
 *   2. Movies    — poster grid blending `usePopular` + `useTopRated`
 *   3. Actors    — debounced person search, filtered to "Acting"
 *   4. Directors — debounced person search, filtered to "Directing"
 *
 * Selections are written straight to `useOnboardingStore` (toggle actions) so
 * they survive refresh + back/forward. On completion we call `complete()` and
 * route to `/recommendations`, where `buildUserProfile` will fold the
 * onboarding signals into the personalized feed.
 *
 * The whole flow is optional — the user can skip at any time. If they bail
 * with no selections we still flip `completed: true` so we don't pester them
 * again next time. Returning to the page (re-visit) shows their existing
 * picks as already-selected, so they can refine without starting over.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Film,
  Loader2,
  Search,
  Sparkles,
  Star,
  User2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MoviePoster } from "@/components/movie";
import { Button, Input, Skeleton } from "@/components/ui";
import {
  useMovieGenres,
  usePopular,
  useSearchPeople,
  useTopRated,
} from "@/hooks/queries";
import { cn } from "@/utils/cn";
import { getProfileUrl } from "@/utils/image";
import { useOnboardingStore } from "@/store/onboarding";

// -----------------------------------------------------------------------------
// Step metadata — kept inline so the array order *is* the step order.
// -----------------------------------------------------------------------------

const STEPS = [
  {
    key: "genres" as const,
    label: "Genres",
    title: "Which genres pull you in?",
    helper:
      "Pick a few flavors you reach for most. We'll weight your feed toward them — you can always change this later.",
    icon: Film,
  },
  {
    key: "movies" as const,
    label: "Movies",
    title: "Mark some all-time favorites.",
    helper:
      "These anchor your taste profile. Genre, cast, crew, and keywords from every pick feed the recommendation engine.",
    icon: Sparkles,
  },
  {
    key: "actors" as const,
    label: "Actors",
    title: "Any on-screen favorites?",
    helper:
      "Optional. Search for actors whose work you'd follow anywhere. We'll surface more of their filmography.",
    icon: User2,
  },
  {
    key: "directors" as const,
    label: "Directors",
    title: "Filmmakers you trust?",
    helper:
      "Optional. Directors whose voice you want more of — auteurs, journeymen, anyone whose name on a project moves the needle for you.",
    icon: Clapperboard,
  },
];

type StepKey = (typeof STEPS)[number]["key"];

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function OnboardingPage(): JSX.Element {
  const router = useRouter();

  const {
    genreIds,
    movieIds,
    actorIds,
    directorIds,
    lastStep,
    toggleGenre,
    toggleMovie,
    toggleActor,
    toggleDirector,
    setLastStep,
    complete,
    reset,
    selectionCount,
  } = useOnboardingStore();

  // Resume where the user left off if they had a partial run.
  const [stepIndex, setStepIndex] = useState<number>(() =>
    Math.min(Math.max(lastStep, 0), STEPS.length - 1),
  );

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), STEPS.length - 1);
    setStepIndex(clamped);
    setLastStep(clamped);
  };

  const handleFinish = () => {
    complete();
    router.push("/recommendations");
  };

  const handleSkipAll = () => {
    // Flip completed even with no selections so we don't hassle the user again
    // next visit. The recommendation engine falls back gracefully on empties.
    complete();
    router.push("/");
  };

  return (
    <div className="relative min-h-[80svh]">
      {/* Decorative ambient blur */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand/15 blur-[140px]" />
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Personalize CineMatch
            </span>

            <button
              type="button"
              onClick={handleSkipAll}
              className="text-xs font-medium text-ink-muted underline-offset-4 transition hover:text-ink hover:underline"
            >
              Skip for now
            </button>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Tune your{" "}
            <span className="text-gradient">recommendations</span> in under a
            minute.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
            Four quick taps to seed your taste profile. Everything you pick
            stays on this device — nothing leaves your browser.
          </p>
        </motion.header>

        {/* ---------------------------------------------------------------- */}
        {/* Stepper / progress                                                */}
        {/* ---------------------------------------------------------------- */}
        <div className="sticky top-20 z-20 -mx-2 mb-8 rounded-2xl border border-border/60 bg-surface/70 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Step {stepIndex + 1} of {STEPS.length} ·{" "}
              <span className="text-ink">{step.label}</span>
            </p>
            <p className="text-xs text-ink-muted">
              {selectionCount()} selection{selectionCount() === 1 ? "" : "s"}{" "}
              so far
            </p>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const reached = i <= stepIndex;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "group relative h-1.5 overflow-hidden rounded-full bg-bg-elevated transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                  )}
                  aria-label={`Go to ${s.label} step`}
                  aria-current={i === stepIndex ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-500 ease-out",
                      reached ? "w-full" : "w-0 group-hover:w-1/4",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Numeric progress for SR users */}
          <span className="sr-only" aria-live="polite">
            {Math.round(progress)} percent complete
          </span>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Step body                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="min-h-[420px]">
          <div className="mb-6 flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
              <step.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {step.title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-muted">
                {step.helper}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {step.key === "genres" ? (
                <GenreStep
                  selected={genreIds}
                  onToggle={toggleGenre}
                />
              ) : step.key === "movies" ? (
                <MovieStep selected={movieIds} onToggle={toggleMovie} />
              ) : step.key === "actors" ? (
                <PeopleStep
                  selected={actorIds}
                  onToggle={toggleActor}
                  department="Acting"
                  placeholder="Search actors — e.g. Florence Pugh, Denzel Washington"
                  emptyHint="Try a full name or last name. We'll filter to actors only."
                />
              ) : (
                <PeopleStep
                  selected={directorIds}
                  onToggle={toggleDirector}
                  department="Directing"
                  placeholder="Search directors — e.g. Greta Gerwig, Bong Joon-ho"
                  emptyHint="Try a full name. We'll filter to directors only."
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Footer controls                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => goTo(stepIndex - 1)}
              disabled={stepIndex === 0}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <button
              type="button"
              onClick={() => {
                reset();
              }}
              className="text-xs font-medium text-ink-subtle underline-offset-4 transition hover:text-ink-muted hover:underline"
            >
              Reset picks
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            {!isLast ? (
              <>
                <Button variant="ghost" onClick={() => goTo(stepIndex + 1)}>
                  Skip step
                </Button>
                <Button onClick={() => goTo(stepIndex + 1)}>
                  Continue
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/discover">Just browse</Link>
                </Button>
                <Button onClick={handleFinish}>
                  <Check className="mr-1 h-4 w-4" />
                  Finish &amp; see picks
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 1 — Genre chips
// -----------------------------------------------------------------------------

function GenreStep({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (id: number) => void;
}): JSX.Element {
  const { data, isLoading } = useMovieGenres();

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  const genres = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {genres.map((g) => {
          const active = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onToggle(g.id)}
              className={cn(
                "group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                active
                  ? "border-brand/60 bg-brand/15 text-ink shadow-sm shadow-brand/10"
                  : "border-border/70 bg-surface/50 text-ink-muted hover:border-border hover:bg-surface hover:text-ink",
              )}
              aria-pressed={active}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border transition",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-border/70 bg-bg-elevated",
                )}
                aria-hidden="true"
              >
                {active ? <Check className="h-3 w-3" /> : null}
              </span>
              {g.name}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-ink-subtle">
        {selected.length === 0
          ? "Pick as many as feel right — there's no wrong answer."
          : `${selected.length} genre${selected.length === 1 ? "" : "s"} selected.`}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 2 — Starter movie picker
// -----------------------------------------------------------------------------

function MovieStep({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (id: number) => void;
}): JSX.Element {
  const popular = usePopular();
  const topRated = useTopRated();

  // Blend the two pools — top-rated first (anchors taste signal) then popular
  // for breadth. De-duplicate by id while preserving order.
  const movies = useMemo(() => {
    const seen = new Set<number>();
    const out: { id: number; title: string; poster_path: string | null; vote_average: number; release_date: string }[] = [];
    const sources = [topRated.data?.results ?? [], popular.data?.results ?? []];
    for (const src of sources) {
      for (const m of src) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        out.push(m);
        if (out.length >= 30) return out;
      }
    }
    return out;
  }, [popular.data, topRated.data]);

  const isLoading =
    (popular.isLoading && !popular.data) || (topRated.isLoading && !topRated.data);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((m) => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              className={cn(
                "group relative block overflow-hidden rounded-xl border text-left transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                active
                  ? "border-brand/70 ring-2 ring-brand/30"
                  : "border-border/60 hover:border-border",
              )}
              aria-pressed={active}
              title={m.title}
            >
              <MoviePoster
                alt={m.title}
                path={m.poster_path}
                size="md"
                className="aspect-[2/3] w-full"
              />

              {/* Selection overlay */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 transition",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {m.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/70">
                    <Star className="h-3 w-3 text-amber-300" />
                    {m.vote_average.toFixed(1)}
                    {m.release_date ? (
                      <>
                        <span className="text-white/40">·</span>
                        <span>{m.release_date.slice(0, 4)}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              {/* Active check badge */}
              {active ? (
                <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
                  <Check className="h-4 w-4" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-ink-subtle">
        {selected.length === 0
          ? "Pick 3–5 movies that scream your taste. More is fine too."
          : `${selected.length} movie${selected.length === 1 ? "" : "s"} selected.`}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Steps 3 & 4 — People (actor/director) search
// -----------------------------------------------------------------------------

function PeopleStep({
  selected,
  onToggle,
  department,
  placeholder,
  emptyHint,
}: {
  selected: number[];
  onToggle: (id: number) => void;
  department: "Acting" | "Directing";
  placeholder: string;
  emptyHint: string;
}): JSX.Element {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useSearchPeople(query, {
    enabled: query.trim().length >= 2,
    instant: true,
  });

  // Filter to the requested craft and sort by popularity. Cap at 24 results
  // to keep the grid scannable.
  const results = useMemo(() => {
    const raw = data?.results ?? [];
    return raw
      .filter((p) => p.known_for_department === department)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 24);
  }, [data, department]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          aria-label={`Search ${department === "Acting" ? "actors" : "directors"}`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-subtle transition hover:bg-bg-elevated hover:text-ink"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Selected chips — visible across queries so users don't lose track */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-surface/40 p-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Picked
          </span>
          {selected.map((id) => (
            <SelectedPersonChip key={id} id={id} onRemove={() => onToggle(id)} results={results} />
          ))}
        </div>
      ) : null}

      {/* Results */}
      {query.trim().length < 2 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-surface/30 px-5 py-10 text-center text-sm text-ink-muted">
          {emptyHint}
        </div>
      ) : isFetching && results.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/40 px-5 py-6 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin opacity-50" aria-hidden="true" />
          No {department === "Acting" ? "actors" : "directors"} matched.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map((person) => {
            const active = selected.includes(person.id);
            const known = person.known_for?.[0]?.title;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => onToggle(person.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border text-left transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                  active
                    ? "border-brand/70 ring-2 ring-brand/30"
                    : "border-border/60 hover:border-border",
                )}
                aria-pressed={active}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-bg-elevated">
                  <Image
                    src={getProfileUrl(person.profile_path, "lg")}
                    alt={person.name}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  {active ? (
                    <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <div className="space-y-0.5 p-3">
                  <p className="truncate text-sm font-semibold">{person.name}</p>
                  {known ? (
                    <p className="truncate text-xs text-ink-muted">Known for {known}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Tiny chip rendered for already-selected people so the user can de-select
 * without re-searching. We try to surface a name from the current result set;
 * if the id isn't in view we just show the id as a fallback label.
 */
function SelectedPersonChip({
  id,
  onRemove,
  results,
}: {
  id: number;
  onRemove: () => void;
  results: Array<{ id: number; name: string }>;
}): JSX.Element {
  const match = results.find((p) => p.id === id);
  const label = match?.name ?? `Person #${id}`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-ink">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-ink-muted transition hover:bg-brand/20 hover:text-ink"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
