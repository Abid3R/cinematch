/**
 * Navbar — sticky glassmorphic header for CineMatch.
 *
 * Layout (desktop):
 *   [Brand wordmark] [Primary nav]                     [Search ⌘K] [Theme] [Sign in]
 *
 * Layout (mobile):
 *   [Brand]                                                          [Search] [Menu]
 *   (menu drawer slides down with the same nav items + theme cycler)
 *
 * Active state is computed from `usePathname()` against each item's href,
 * honoring the `exact` flag (so Home doesn't stay highlighted on every page).
 * The search button toggles the global command palette; the theme button
 * cycles dark → light → system through the theme store.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Menu, Monitor, Moon, Search, Sun, X } from "lucide-react";

import { ProfileMenu } from "@/components/layout/profile-menu";
import { Button } from "@/components/ui/button";
import { commandPalette } from "@/components/ui/command-palette";
import { PRIMARY_NAV, SITE_NAME } from "@/constants/site";
import { resolveEffectiveTheme, useThemeStore } from "@/store/theme";
import { cn } from "@/utils/cn";

export interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add a subtle border/extra blur once the user has scrolled past the hero.
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-border bg-bg/70 backdrop-blur-xl"
          : "border-b border-transparent bg-bg/30 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <span className="relative flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Film className="size-5 text-white" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            {SITE_NAME}
          </span>
        </Link>

        {/* Desktop primary nav */}
        <nav className="hidden flex-1 items-center md:flex">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none",
                      "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                      active
                        ? "text-ink"
                        : "text-ink-muted hover:bg-surface hover:text-ink",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{item.label}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger />
          <ThemeToggle />
          <ProfileMenu />
          <Button
            asChild
            size="sm"
            variant="primary"
            className="hidden sm:inline-flex"
          >
            <Link href="/onboarding">Get started</Link>
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={cn(
          "md:hidden",
          "overflow-hidden border-t border-border bg-bg-elevated/90 backdrop-blur-xl",
          "transition-[max-height,opacity] duration-300 ease-spring",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-surface text-ink"
                        : "text-ink-muted hover:bg-surface hover:text-ink",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="mt-2">
              <Button asChild size="md" variant="primary" className="w-full">
                <Link href="/onboarding">Get started</Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

// -----------------------------------------------------------------------------
// Pieces
// -----------------------------------------------------------------------------

function SearchTrigger() {
  // Show the right modifier key per platform without breaking SSR.
  const [modifier, setModifier] = useState("Ctrl");
  useEffect(() => {
    const isMac =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
    setModifier(isMac ? "⌘" : "Ctrl");
  }, []);

  return (
    <>
      {/* Desktop: pill with shortcut */}
      <button
        type="button"
        onClick={() => commandPalette.toggle()}
        aria-label="Open search"
        className={cn(
          "group hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-muted transition-colors sm:flex",
          "hover:border-border-strong hover:text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        )}
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden lg:inline">Search films…</span>
        <span className="hidden lg:inline text-xs font-medium text-ink-subtle">
          <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 font-sans">
            {modifier}
          </kbd>{" "}
          <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 font-sans">
            K
          </kbd>
        </span>
      </button>

      {/* Mobile: icon-only */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open search"
        className="sm:hidden"
        onClick={() => commandPalette.toggle()}
      >
        <Search className="size-5" aria-hidden="true" />
      </Button>
    </>
  );
}

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const cycle = useThemeStore((s) => s.cycle);

  // Avoid a hydration mismatch on the icon by waiting until mount before
  // reading the effective theme.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const effective = mounted ? resolveEffectiveTheme(mode) : "dark";
  const next =
    mode === "dark" ? "light" : mode === "light" ? "system" : "dark";

  const Icon = mode === "system" ? Monitor : effective === "dark" ? Moon : Sun;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${mode}. Switch to ${next}.`}
      title={`Theme: ${mode}`}
      onClick={cycle}
    >
      <Icon className="size-5" aria-hidden="true" />
    </Button>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
