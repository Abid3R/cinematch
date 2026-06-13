/**
 * Discover page — the full catalog browser.
 *
 * This route is the "deep end" of the app: full filter sidebar, infinite scroll
 * grid, URL-synced filter state (so the page is shareable and back-button
 * friendly), and a sticky filter chip summary so users always know what they
 * applied.
 *
 * Filter state lives in the URL via `useSearchParams` + `router.replace`. This
 * means:
 *   - Refresh / share works out of the box
 *   - The browser back button steps through filter changes
 *   - We never need a separate "filter store" — the URL IS the store
 *
 * Cache reuse: `useDiscoverInfinite` strips `page` from the cache key, so
 * scrolling further never re-keys the cache, and toggling the same filter
 * twice serves from memory.
 */

"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Filter,
  Languages,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { MovieGrid } from "@/components/movie";
import { Button, Input } from "@/components/ui";
import { useDiscoverInfinite, useMovieGenres } from "@/hooks/queries";
import type { DiscoverFilters, Movie, SortBy } from "@/types/tmdb";
import { cn } from "@/utils/cn";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SORT_OPTIONS: { value: SortBy; label: string; icon: typeof TrendingUp }[] = [
  { value: "popularity.desc", label: "Most popular", icon: TrendingUp },
  { value: "vote_average.desc", label: "Highest rated", icon: Star },
  { value: "release_date.desc", label: "Newest", icon: Calendar },
  { value: "release_date.asc", label: "Oldest", icon: Calendar },
  { value: "revenue.desc", label: "Top grossing", icon: TrendingUp },
  { value: "vote_count.desc", label: "Most rated", icon: Star },
];

const LANGUAGE_OPTIONS = [
  { value: "", label: "Any language" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

// -----------------------------------------------------------------------------
// URL <-> Filters
// -----------------------------------------------------------------------------

interface DiscoverPageFilters {
  sort: SortBy;
  genres: number[];
  yearFrom?: number;
  yearTo?: number;
  ratingMin: number;
  runtimeMin?: number;
  runtimeMax?: number;
  language: string;
  voteCountMin: number;
}

const DEFAULT_FILTERS: DiscoverPageFilters = {
  sort: "popularity.desc",
  genres: [],
  ratingMin: 0,
  language: "",
  voteCountMin: 50,
};

function parseFiltersFromSearchParams(
  params: URLSearchParams,
): DiscoverPageFilters {
  const sort = (params.get("sort") as SortBy) ?? DEFAULT_FILTERS.sort;
  const genres =
    params
      .get("genres")
      ?.split(",")
      .map((g) => Number.parseInt(g, 10))
      .filter((g) => Number.isFinite(g) && g > 0) ?? [];

  const parseNum = (key: string): number | undefined => {
    const raw = params.get(key);
    if (raw === null || raw === "") return undefined;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    sort,
    genres,
    yearFrom: parseNum("yearFrom"),
    yearTo: parseNum("yearTo"),
    ratingMin: parseNum("ratingMin") ?? 0,
    runtimeMin: parseNum("runtimeMin"),
    runtimeMax: parseNum("runtimeMax"),
    language: params.get("lang") ?? "",
    voteCountMin: parseNum("voteCountMin") ?? 50,
  };
}

function filtersToSearchParams(filters: DiscoverPageFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.genres.length) params.set("genres", filters.genres.join(","));
  if (filters.yearFrom) params.set("yearFrom", String(filters.yearFrom));
  if (filters.yearTo) params.set("yearTo", String(filters.yearTo));
  if (filters.ratingMin > 0) params.set("ratingMin", String(filters.ratingMin));
  if (filters.runtimeMin)
    params.set("runtimeMin", String(filters.runtimeMin));
  if (filters.runtimeMax)
    params.set("runtimeMax", String(filters.runtimeMax));
  if (filters.language) params.set("lang", filters.language);
  if (filters.voteCountMin !== DEFAULT_FILTERS.voteCountMin)
    params.set("voteCountMin", String(filters.voteCountMin));
  return params;
}

function filtersToApi(filters: DiscoverPageFilters): DiscoverFilters {
  const api: DiscoverFilters = { sort_by: filters.sort };

  if (filters.genres.length) api.with_genres = filters.genres.join(",");
  if (filters.yearFrom)
    api["primary_release_date.gte"] = `${filters.yearFrom}-01-01`;
  if (filters.yearTo)
    api["primary_release_date.lte"] = `${filters.yearTo}-12-31`;
  if (filters.ratingMin > 0) api["vote_average.gte"] = filters.ratingMin;
  if (filters.runtimeMin) api["with_runtime.gte"] = filters.runtimeMin;
  if (filters.runtimeMax) api["with_runtime.lte"] = filters.runtimeMax;
  if (filters.language) api.with_original_language = filters.language;
  if (filters.voteCountMin) api["vote_count.gte"] = filters.voteCountMin;

  return api;
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function DiscoverPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Derive filter state from the URL. This is the single source of truth.
  const filters = useMemo(
    () => parseFiltersFromSearchParams(new URLSearchParams(searchParams)),
    [searchParams],
  );

  // Push new filter state to the URL. Using `replace` avoids polluting back
  // history with every chip toggle.
  const updateFilters = useCallback(
    (next: DiscoverPageFilters) => {
      const params = filtersToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/discover?${qs}` : "/discover", { scroll: false });
    },
    [router],
  );

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const apiFilters = useMemo(() => filtersToApi(filters), [filters]);
  const genresQuery = useMovieGenres();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useDiscoverInfinite(apiFilters);

  const movies = useMemo<Movie[]>(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data],
  );

  const totalResults = data?.pages[0]?.total_results ?? 0;

  // ---------------------------------------------------------------------------
  // Filter helpers
  // ---------------------------------------------------------------------------
  const toggleGenre = useCallback(
    (genreId: number) => {
      const next = filters.genres.includes(genreId)
        ? filters.genres.filter((g) => g !== genreId)
        : [...filters.genres, genreId];
      updateFilters({ ...filters, genres: next });
    },
    [filters, updateFilters],
  );

  const resetFilters = useCallback(() => {
    updateFilters(DEFAULT_FILTERS);
  }, [updateFilters]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.sort !== DEFAULT_FILTERS.sort) n++;
    if (filters.genres.length) n++;
    if (filters.yearFrom || filters.yearTo) n++;
    if (filters.ratingMin > 0) n++;
    if (filters.runtimeMin || filters.runtimeMax) n++;
    if (filters.language) n++;
    if (filters.voteCountMin !== DEFAULT_FILTERS.voteCountMin) n++;
    return n;
  }, [filters]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-3 sm:mb-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Discover
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Browse the <span className="text-gradient">whole catalog</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
              Filter by genre, year, rating and language to find your next
              watch. {totalResults > 0 ? formatTotal(totalResults) : ""}
            </p>
          </div>

          {/* Mobile filter trigger */}
          <Button
            variant="ghost"
            className="lg:hidden"
            onClick={() => setFilterSheetOpen((s) => !s)}
            aria-expanded={filterSheetOpen}
          >
            <SlidersHorizontal className="mr-1 h-4 w-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 ? (
          <ActiveChips
            filters={filters}
            genres={genresQuery.data ?? []}
            onClear={resetFilters}
            onRemoveGenre={toggleGenre}
            onClearKey={(key) => {
              const next = { ...filters };
              if (key === "year") {
                next.yearFrom = undefined;
                next.yearTo = undefined;
              } else if (key === "rating") {
                next.ratingMin = 0;
              } else if (key === "runtime") {
                next.runtimeMin = undefined;
                next.runtimeMax = undefined;
              } else if (key === "lang") {
                next.language = "";
              } else if (key === "sort") {
                next.sort = DEFAULT_FILTERS.sort;
              }
              updateFilters(next);
            }}
          />
        ) : null}
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FiltersPanel
              filters={filters}
              genres={genresQuery.data ?? []}
              onChange={updateFilters}
              onToggleGenre={toggleGenre}
              onReset={resetFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </aside>

        {/* Mobile filter sheet */}
        {filterSheetOpen ? (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setFilterSheetOpen(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto border-r border-border/60 bg-bg-elevated p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(false)}
                  className="rounded-lg p-2 text-ink-muted hover:bg-surface hover:text-ink"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FiltersPanel
                filters={filters}
                genres={genresQuery.data ?? []}
                onChange={updateFilters}
                onToggleGenre={toggleGenre}
                onReset={resetFilters}
                activeCount={activeFilterCount}
              />
            </motion.div>
          </div>
        ) : null}

        {/* Results */}
        <div className="min-w-0">
          {isError ? (
            <ErrorPanel onRetry={refetch} />
          ) : (
            <MovieGrid
              movies={movies}
              isLoading={isLoading}
              isLoadingMore={isFetchingNextPage}
              onEndReached={handleLoadMore}
              density="default"
              skeletonCount={18}
              emptyState={
                <>
                  <p className="text-base font-medium text-ink">
                    Nothing matches those filters.
                  </p>
                  <p className="text-sm text-ink-muted">
                    Try widening the year range or removing a genre.
                  </p>
                  <Button variant="ghost" onClick={resetFilters} className="mt-2">
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reset filters
                  </Button>
                </>
              }
            />
          )}

          {/* End-of-catalog marker */}
          {!hasNextPage && movies.length > 0 ? (
            <p className="mt-10 text-center text-sm text-ink-subtle">
              That&apos;s every match — {movies.length.toLocaleString()} movies.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Filter sidebar / sheet body
// -----------------------------------------------------------------------------

interface FiltersPanelProps {
  filters: DiscoverPageFilters;
  genres: { id: number; name: string }[];
  onChange: (f: DiscoverPageFilters) => void;
  onToggleGenre: (id: number) => void;
  onReset: () => void;
  activeCount: number;
}

function FiltersPanel({
  filters,
  genres,
  onChange,
  onToggleGenre,
  onReset,
  activeCount,
}: FiltersPanelProps): JSX.Element {
  return (
    <div className="space-y-7 rounded-2xl border border-border/60 bg-surface/40 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[0.65rem] font-bold text-brand">
              {activeCount}
            </span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Reset
          </button>
        ) : null}
      </div>

      {/* Sort */}
      <FilterGroup label="Sort by">
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = filters.sort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...filters, sort: opt.value })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                  active
                    ? "bg-brand/15 font-medium text-brand"
                    : "text-ink-muted hover:bg-surface hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Genres */}
      <FilterGroup label="Genres">
        <div className="flex flex-wrap gap-1.5">
          {genres.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-16 animate-pulse rounded-full bg-bg-elevated"
                />
              ))
            : genres.map((genre) => {
                const active = filters.genres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => onToggleGenre(genre.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-border/60 bg-surface/60 text-ink-muted hover:border-ink/30 hover:text-ink",
                    )}
                  >
                    {genre.name}
                  </button>
                );
              })}
        </div>
      </FilterGroup>

      {/* Year range */}
      <FilterGroup label="Year">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="From"
            min={MIN_YEAR}
            max={CURRENT_YEAR + 5}
            value={filters.yearFrom ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                yearFrom: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="text-sm"
          />
          <span className="text-ink-subtle">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="To"
            min={MIN_YEAR}
            max={CURRENT_YEAR + 5}
            value={filters.yearTo ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                yearTo: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="text-sm"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { label: "This year", from: CURRENT_YEAR, to: CURRENT_YEAR },
            { label: "2020s", from: 2020, to: CURRENT_YEAR },
            { label: "2010s", from: 2010, to: 2019 },
            { label: "2000s", from: 2000, to: 2009 },
            { label: "90s", from: 1990, to: 1999 },
            { label: "Classic", from: MIN_YEAR, to: 1979 },
          ].map((quick) => (
            <button
              key={quick.label}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  yearFrom: quick.from,
                  yearTo: quick.to,
                })
              }
              className="rounded-full border border-border/60 bg-surface/60 px-2.5 py-0.5 text-[0.7rem] text-ink-muted transition hover:border-ink/30 hover:text-ink"
            >
              {quick.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup label={`Minimum rating · ${filters.ratingMin.toFixed(1)}★`}>
        <input
          type="range"
          min={0}
          max={9}
          step={0.5}
          value={filters.ratingMin}
          onChange={(e) =>
            onChange({ ...filters, ratingMin: Number(e.target.value) })
          }
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-bg-elevated accent-brand"
          aria-label="Minimum rating"
        />
        <div className="mt-1 flex justify-between text-[0.65rem] text-ink-subtle">
          <span>Any</span>
          <span>9.0+</span>
        </div>
      </FilterGroup>

      {/* Runtime */}
      <FilterGroup label="Runtime (minutes)">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            min={0}
            max={500}
            value={filters.runtimeMin ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                runtimeMin: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            className="text-sm"
          />
          <span className="text-ink-subtle">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            min={0}
            max={500}
            value={filters.runtimeMax ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                runtimeMax: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            className="text-sm"
          />
        </div>
      </FilterGroup>

      {/* Language */}
      <FilterGroup label={
        <span className="flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5" />
          Original language
        </span>
      }>
        <select
          value={filters.language}
          onChange={(e) => onChange({ ...filters, language: e.target.value })}
          className="w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterGroup>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Active chip bar
// -----------------------------------------------------------------------------

function ActiveChips({
  filters,
  genres,
  onClear,
  onRemoveGenre,
  onClearKey,
}: {
  filters: DiscoverPageFilters;
  genres: { id: number; name: string }[];
  onClear: () => void;
  onRemoveGenre: (id: number) => void;
  onClearKey: (key: "year" | "rating" | "runtime" | "lang" | "sort") => void;
}): JSX.Element {
  const genreNames = useMemo(
    () => new Map(genres.map((g) => [g.id, g.name] as const)),
    [genres],
  );

  const yearLabel = filters.yearFrom && filters.yearTo
    ? `${filters.yearFrom}–${filters.yearTo}`
    : filters.yearFrom
      ? `${filters.yearFrom}+`
      : filters.yearTo
        ? `≤ ${filters.yearTo}`
        : null;

  const runtimeLabel = filters.runtimeMin && filters.runtimeMax
    ? `${filters.runtimeMin}–${filters.runtimeMax}m`
    : filters.runtimeMin
      ? `${filters.runtimeMin}m+`
      : filters.runtimeMax
        ? `≤ ${filters.runtimeMax}m`
        : null;

  const sortLabel =
    filters.sort !== DEFAULT_FILTERS.sort
      ? SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? null
      : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sortLabel ? (
        <Chip onRemove={() => onClearKey("sort")}>Sort: {sortLabel}</Chip>
      ) : null}
      {filters.genres.map((id) => (
        <Chip key={id} onRemove={() => onRemoveGenre(id)}>
          {genreNames.get(id) ?? `Genre ${id}`}
        </Chip>
      ))}
      {yearLabel ? (
        <Chip onRemove={() => onClearKey("year")}>{yearLabel}</Chip>
      ) : null}
      {filters.ratingMin > 0 ? (
        <Chip onRemove={() => onClearKey("rating")}>
          ≥ {filters.ratingMin.toFixed(1)}★
        </Chip>
      ) : null}
      {runtimeLabel ? (
        <Chip onRemove={() => onClearKey("runtime")}>{runtimeLabel}</Chip>
      ) : null}
      {filters.language ? (
        <Chip onRemove={() => onClearKey("lang")}>
          {LANGUAGE_OPTIONS.find((l) => l.value === filters.language)?.label ??
            filters.language.toUpperCase()}
        </Chip>
      ) : null}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Clear all
      </button>
    </div>
  );
}

function Chip({
  children,
  onRemove,
}: {
  children: ReactNode;
  onRemove: () => void;
}): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 py-1 pl-3 pr-1 text-xs font-medium text-brand">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-brand/80 transition hover:bg-brand/20 hover:text-brand"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// -----------------------------------------------------------------------------
// Misc helpers
// -----------------------------------------------------------------------------

function FilterGroup({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <div>
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      {children}
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
      <p className="text-base font-medium text-ink">
        Couldn&apos;t load these results.
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        The movie service is taking a breather. Try again in a moment.
      </p>
      <Button variant="ghost" onClick={onRetry} className="mt-4">
        <RotateCcw className="mr-1 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

function formatTotal(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M titles match.`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k titles match.`;
  return `${n.toLocaleString()} titles match.`;
}
