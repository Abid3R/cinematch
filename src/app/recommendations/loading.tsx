/**
 * Recommendations route loading state.
 *
 * Server-rendered skeleton shown during the initial route transition. Mirrors
 * the real page shell — header card plus a stack of rails — so the swap to
 * real content is visually continuous. After the segment resolves, the page's
 * own React Query skeletons take over for subsequent refetches.
 */

import { MovieCardSkeleton } from "@/components/movie";

export default function RecommendationsLoading(): JSX.Element {
  return (
    <div
      className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header card skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface/80 via-surface/40 to-brand/10 p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="h-6 w-32 rounded-full bg-bg-elevated/70" />
          <div className="h-10 w-72 rounded-lg bg-bg-elevated sm:h-12 sm:w-96" />
          <div className="h-4 w-full max-w-xl rounded bg-bg-elevated/70" />
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="h-7 w-32 rounded-full bg-bg-elevated/70" />
            <div className="h-7 w-24 rounded-full bg-bg-elevated/70" />
          </div>
        </div>
      </div>

      {/* Rail stack skeleton */}
      <div className="mt-10 space-y-14 lg:space-y-16">
        {Array.from({ length: 3 }).map((_, sectionIdx) => (
          <div key={sectionIdx} className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-3">
                <div className="h-4 w-24 rounded bg-bg-elevated/70" />
                <div className="h-7 w-56 rounded-lg bg-bg-elevated sm:w-72" />
                <div className="h-4 w-80 rounded bg-bg-elevated/60" />
              </div>
              <div className="hidden h-9 w-24 rounded-lg bg-bg-elevated/70 sm:block" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, cardIdx) => (
                <MovieCardSkeleton key={cardIdx} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading recommendations…</span>
    </div>
  );
}
