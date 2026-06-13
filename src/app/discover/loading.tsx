/**
 * Discover route loading state.
 *
 * Rendered by Next.js while the route segment is in flight on first
 * navigation. Mirrors the page shell — header, sidebar, grid — so the swap
 * to real content is seamless. After the segment resolves, React Query's
 * own skeletons take over for subsequent filter changes.
 */

import { MovieCardSkeleton } from "@/components/movie";

export default function DiscoverLoading(): JSX.Element {
  return (
    <div
      className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-4 w-32 rounded bg-bg-elevated/70" />
        <div className="h-10 w-72 rounded-lg bg-bg-elevated" />
        <div className="h-4 w-96 rounded bg-bg-elevated/70" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar skeleton (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-border/60 bg-surface/40 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-24 rounded bg-bg-elevated" />
                <div className="space-y-2">
                  <div className="h-9 w-full rounded-lg bg-bg-elevated/70" />
                  <div className="h-9 w-5/6 rounded-lg bg-bg-elevated/70" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Grid skeleton */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-bg-elevated/70" />
            <div className="h-9 w-28 rounded-lg bg-bg-elevated/70 lg:hidden" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Loading discover…</span>
    </div>
  );
}
