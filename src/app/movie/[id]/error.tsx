/**
 * Movie details route error boundary.
 *
 * Catches uncaught render errors inside `/movie/[id]`. Bad IDs route through
 * `notFound()`; this boundary catches the remainder — TMDB outages, unexpected
 * shapes, downstream component crashes.
 */
"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Compass, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MovieDetailsError({ error, reset }: ErrorPageProps): JSX.Element {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[movie/:id] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70svh] items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-surface/60 p-8 backdrop-blur-xl sm:p-10"
        role="alert"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-danger/20 blur-3xl" />

        <div className="relative">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Couldn&apos;t load this movie.
          </h1>
          <p className="mt-2 text-sm text-ink-muted sm:text-base">
            Something tripped on the way to the details page. Try again, or head
            back to keep browsing.
          </p>

          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-ink-subtle">
              ref: {error.digest}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={reset}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">
                <Compass className="mr-1 h-4 w-4" />
                Back home
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
