/**
 * Global 404 page.
 *
 * Rendered for any route the App Router can't match (including dynamic
 * segments that throw `notFound()`). We keep the design playful but on-brand:
 * gradient headline, two clear paths forward, and a hint that surfaces in the
 * site's search vocabulary so the user doesn't get stuck.
 */

import { Compass, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui";

export default function NotFound(): JSX.Element {
  return (
    <div className="flex min-h-[70svh] items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-surface/60 p-8 text-center backdrop-blur-xl sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-ink-subtle">
            404
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-gradient">Lost in the credits.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-ink-muted">
            That page rolled off the reel. Try the home feed or jump into
            discovery to find your next favorite.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">
                <Home className="mr-1 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/discover">
                <Compass className="mr-1 h-4 w-4" />
                Discover movies
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
