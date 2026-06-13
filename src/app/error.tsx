/**
 * Home route error boundary.
 *
 * Caught at the App Router segment level: any uncaught render error inside the
 * home page renders this UI instead of cascading to the root error boundary.
 * It must be a client component because `reset` is wired to a callback handed
 * down by the framework. We log to the console in dev for debugability and
 * offer the user two paths forward: retry the segment or go back home.
 */

"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HomeError({ error, reset }: ErrorPageProps): JSX.Element {
  useEffect(() => {
    // Surface the error in dev tools; in production the digest is what the
    // server logs key off of, so we keep that visible too.
    // eslint-disable-next-line no-console
    console.error("[home] route error:", error);
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
            Something went sideways.
          </h1>
          <p className="mt-2 text-sm text-ink-muted sm:text-base">
            We hit a snag loading the home page. This is usually a hiccup with
            the movie service — give it another shot.
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
                <Home className="mr-1 h-4 w-4" />
                Back home
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
