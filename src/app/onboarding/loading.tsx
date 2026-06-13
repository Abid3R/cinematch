/**
 * Onboarding route loading state.
 *
 * Mirrors the page shell — header, sticky stepper, body grid — so the swap to
 * real content is seamless. Rendered by Next.js while the route segment is in
 * flight on first navigation; once mounted, the page's own in-place skeletons
 * take over (genre chip skeletons, poster skeletons, person card skeletons).
 */

import { Skeleton } from "@/components/ui";

export default function OnboardingLoading(): JSX.Element {
  return (
    <div
      className="relative min-h-[80svh]"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Decorative ambient blur — matches the page so the silhouette doesn't shift */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        {/* Header skeleton */}
        <div className="mb-6 space-y-3">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-10 w-3/4 max-w-xl rounded-lg" />
          <Skeleton className="h-10 w-1/2 max-w-md rounded-lg" />
          <Skeleton className="h-4 w-2/3 max-w-lg rounded" />
        </div>

        {/* Stepper skeleton */}
        <div className="sticky top-20 z-20 -mx-2 mb-8 rounded-2xl border border-border/60 bg-surface/70 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-1.5 w-full rounded-full" />
            ))}
          </div>
        </div>

        {/* Step body skeleton — defaults to the genre chip layout */}
        <section>
          <div className="mb-6 flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-72 max-w-full rounded" />
              <Skeleton className="h-4 w-full max-w-2xl rounded" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-full" />
            ))}
          </div>
        </section>

        {/* Footer skeleton */}
        <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        <span className="sr-only">Loading onboarding…</span>
      </div>
    </div>
  );
}
