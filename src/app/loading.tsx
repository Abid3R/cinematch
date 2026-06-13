/**
 * Home route loading state.
 *
 * Mirrors the structure of `page.tsx`: a banner skeleton followed by skeleton
 * rows. Next.js renders this automatically while server-resolved data for the
 * route segment is in flight. Because most of our data is client-fetched via
 * React Query, this UI is most visible during the very first navigation; once
 * the user is in the app, query-level skeletons take over.
 */

import { MovieBannerSkeleton } from "@/components/movie";

export default function HomeLoading(): JSX.Element {
  return (
    <div className="relative" aria-busy="true" aria-live="polite">
      <MovieBannerSkeleton />

      <div className="mx-auto max-w-[1400px] space-y-12 px-4 py-12 sm:px-6 lg:space-y-16 lg:px-10 lg:py-16">
        {Array.from({ length: 3 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>

      <span className="sr-only">Loading recommendations…</span>
    </div>
  );
}

function RowSkeleton(): JSX.Element {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-md bg-bg-elevated" />
        <div className="h-4 w-72 rounded bg-bg-elevated/70" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-40 shrink-0 sm:w-48 lg:w-52">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-bg-elevated">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
            <div className="mt-2 h-4 w-3/4 rounded bg-bg-elevated" />
            <div className="mt-1 h-3 w-1/3 rounded bg-bg-elevated/70" />
          </div>
        ))}
      </div>
    </section>
  );
}
