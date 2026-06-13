/**
 * Footer — minimal glassmorphic footer with brand, navigation, and credit.
 *
 * Three columns on desktop (brand + tagline, link group, credit / signoff)
 * collapsing to a single column on mobile. TMDB attribution is required by the
 * TMDB API terms of use, so it ships with the credit line and not as
 * configurable copy.
 */
"use client";

import Link from "next/link";
import { Film, Github, Heart } from "lucide-react";

import {
  FOOTER_LINKS,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/constants/site";
import { cn } from "@/utils/cn";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative mt-24 border-t border-border bg-bg-elevated/60 backdrop-blur-xl",
        className,
      )}
    >
      {/* Top hairline highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
      />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet shadow-glow">
              <Film className="size-5 text-white" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              {SITE_NAME}
            </span>
          </Link>
          <p className="max-w-xs text-sm text-ink-muted">{SITE_TAGLINE}</p>
        </div>

        {/* Navigation column */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Explore
          </h3>
          <ul className="grid grid-cols-2 gap-y-2 gap-x-6">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Credit / signoff column */}
        <div className="flex flex-col gap-4 md:items-end">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Powered by
          </h3>
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            <TmdbMark />
            <span>The Movie Database</span>
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <Github className="size-4" aria-hidden="true" />
            <span>Source on GitHub</span>
          </a>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-subtle sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {year} {SITE_NAME}. This product uses the TMDB API but is not
            endorsed or certified by TMDB.
          </p>
          <p className="inline-flex items-center gap-1.5">
            Made with{" "}
            <Heart
              className="size-3.5 fill-brand-500 text-brand-500"
              aria-hidden="true"
            />{" "}
            for film lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Tiny inline TMDB mark — three sized dots in the official palette. */
function TmdbMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-4 items-center gap-0.5"
    >
      <span className="block size-2 rounded-full bg-[#0d253f]" />
      <span className="block size-2 rounded-full bg-[#01b4e4]" />
      <span className="block size-2 rounded-full bg-[#90cea1]" />
    </span>
  );
}
