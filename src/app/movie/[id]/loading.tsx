/**
 * Movie details route loading skeleton.
 *
 * Server-rendered, structurally mirrors `page.tsx` so the layout doesn't shift
 * when real data arrives:
 *  - Hero backdrop + poster + title metadata
 *  - Action row placeholders (watchlist / like / dislike / rate)
 *  - Two-column overview + sidebar
 *  - Cast carousel skeleton
 *  - "More like this" rail skeleton
 */

import { Skeleton } from "@/components/ui";

export default function MovieDetailsLoading(): JSX.Element {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative">
        <Skeleton className="absolute inset-0 h-[70svh] w-full rounded-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-transparent" />

        <div className="relative mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-end gap-6 px-4 pb-12 pt-32 sm:px-6 lg:flex-row lg:items-end lg:px-8 lg:pb-16">
          <Skeleton className="hidden aspect-[2/3] w-56 shrink-0 rounded-2xl lg:block" />

          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-12 w-2/3 rounded-xl" />
            <Skeleton className="h-5 w-1/2 rounded-md" />

            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-20 rounded-full" />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-5 w-24 rounded-md" />
              <div className="aspect-video w-full overflow-hidden rounded-2xl">
                <Skeleton className="h-full w-full rounded-none" />
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-5 w-20 rounded-md" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-28 shrink-0 space-y-2">
                    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                    <Skeleton className="h-3 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-2/3 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 backdrop-blur-md">
              <Skeleton className="mb-4 h-5 w-32 rounded-md" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Recs rail */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-6 w-48 rounded-md" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-44 shrink-0 space-y-2 sm:w-52">
              <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
              <Skeleton className="h-3 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
