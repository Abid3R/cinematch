/**
 * Profile page — the manage-screen behind the navbar avatar dropdown.
 *
 * Sections (top → bottom):
 *   1. Active profile header — large avatar, inline rename, emoji picker,
 *      member-since timestamp, lightweight activity stats.
 *   2. Profile switcher — every saved profile rendered as a card with a
 *      "Switch" CTA and a "Delete" CTA (hidden when only one profile remains),
 *      plus an inline "Add profile" form.
 *   3. Watch later — the active profile's watchlist rendered through MovieGrid
 *      with a helpful empty state pointing back to /discover.
 *   4. Finished — the active profile's watched/finished list, also rendered
 *      through MovieGrid, with copy explaining how the list gets populated.
 *
 * Everything is fully client-side. A mounted-state guard wraps the persisted
 * reads to dodge SSR/hydration mismatches on data that only exists in
 * localStorage. Visual language matches the discover page: max-w-[1500px]
 * container, a brand pill heading, a gradient title, framer-motion fade-up
 * intros, and 2xl glassmorphic cards.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  Film,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import { MovieGrid } from "@/components/movie/movie-grid";
import { Button } from "@/components/ui/button";
import { useProfilesStore } from "@/store/profiles";
import { useWatchedStore } from "@/store/watched";
import { useWatchlistStore } from "@/store/watchlist";
import { cn } from "@/utils/cn";

// Local mirror of the emoji catalog — kept in sync with `store/profiles.ts`.
// Exporting it from the store would expand its public surface area for one UI;
// duplicating a 16-character array is cheaper than that coupling.
const EMOJI_POOL = [
  "🎬", "🍿", "🎞️", "🎟️", "🎭", "🌟", "⭐", "🚀",
  "🦊", "🐯", "🐼", "🐧", "🐙", "🦄", "🐲", "🌈",
];

const EASE_OUT_BACK = [0.22, 1, 0.36, 1] as const;

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function ProfilePage() {
  // Persisted stores can hydrate after first render — keep the SSR pass empty
  // and unblock the rich UI on the client tick.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <ProfileSkeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <ProfileContent />
    </main>
  );
}

// -----------------------------------------------------------------------------
// Mounted content
// -----------------------------------------------------------------------------

function ProfileContent() {
  const profiles = useProfilesStore((s) => s.profiles);
  const activeProfileId = useProfilesStore((s) => s.activeProfileId);
  const renameProfile = useProfilesStore((s) => s.renameProfile);
  const setEmoji = useProfilesStore((s) => s.setEmoji);

  const watchlistItems = useWatchlistStore((s) => s.items);
  const watchedItems = useWatchedStore((s) => s.items);
  const clearWatched = useWatchedStore((s) => s.clear);
  const clearWatchlist = useWatchlistStore((s) => s.clear);

  const active = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? profiles[0],
    [profiles, activeProfileId],
  );

  const watchlistMovies = useMemo(
    () => watchlistItems.map((item) => item.movie),
    [watchlistItems],
  );
  const watchedMovies = useMemo(
    () => watchedItems.map((item) => item.movie),
    [watchedItems],
  );

  if (!active) return null;

  return (
    <div className="space-y-12">
      {/* --------------------------------------------------------------- */}
      {/* Page intro                                                       */}
      {/* --------------------------------------------------------------- */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_BACK }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-500">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Your space
        </span>
        <h1 className="mt-3 bg-gradient-to-r from-ink via-ink to-ink-muted bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
          Profile & library
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
          Manage every profile sharing this browser, jump back into films
          you&apos;ve saved, and keep a tidy log of everything you&apos;ve
          finished.
        </p>
      </motion.header>

      {/* --------------------------------------------------------------- */}
      {/* Active profile card                                              */}
      {/* --------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_BACK, delay: 0.05 }}
        aria-labelledby="active-profile-heading"
      >
        <h2 id="active-profile-heading" className="sr-only">
          Active profile
        </h2>
        <ActiveProfileCard
          name={active.name}
          emoji={active.emoji}
          createdAt={active.createdAt}
          watchlistCount={watchlistItems.length}
          watchedCount={watchedItems.length}
          onRename={(next) => renameProfile(active.id, next)}
          onPickEmoji={(emoji) => setEmoji(active.id, emoji)}
        />
      </motion.section>

      {/* --------------------------------------------------------------- */}
      {/* Profile switcher                                                 */}
      {/* --------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_BACK, delay: 0.1 }}
        aria-labelledby="switcher-heading"
        className="space-y-5"
      >
        <SectionHeading
          id="switcher-heading"
          eyebrow="Profiles"
          title="Switch or add a profile"
          description="Each profile keeps its own watchlist, ratings, history, and onboarding answers — perfect for sharing the browser without crossing wires."
        />
        <ProfileSwitcher />
      </motion.section>

      {/* --------------------------------------------------------------- */}
      {/* Watch later                                                      */}
      {/* --------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_BACK, delay: 0.15 }}
        aria-labelledby="watch-later-heading"
        className="space-y-5"
      >
        <SectionHeading
          id="watch-later-heading"
          eyebrow="Watch later"
          icon={<BookmarkPlus className="size-3.5" aria-hidden="true" />}
          title={
            watchlistItems.length > 0
              ? `${watchlistItems.length} film${watchlistItems.length === 1 ? "" : "s"} saved for later`
              : "Save films you want to watch later"
          }
          description="Tap the bookmark on any film to add it here. Saved films stay tied to this profile."
          action={
            watchlistItems.length > 0 ? (
              <ConfirmingDestructiveButton
                label="Clear watchlist"
                confirmLabel="Confirm clear"
                onConfirm={() => clearWatchlist()}
              />
            ) : null
          }
        />
        <MovieGrid
          movies={watchlistMovies}
          density="default"
          emptyState={
            <EmptyState
              icon={<BookmarkPlus className="size-6" aria-hidden="true" />}
              title="Nothing saved yet"
              description="Browse Discover and tap the bookmark on any film to start building your watchlist."
              cta={
                <Button asChild size="md" variant="primary">
                  <Link href="/discover" className="inline-flex items-center gap-2">
                    Browse Discover
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
          }
        />
      </motion.section>

      {/* --------------------------------------------------------------- */}
      {/* Finished                                                         */}
      {/* --------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_BACK, delay: 0.2 }}
        aria-labelledby="finished-heading"
        className="space-y-5"
      >
        <SectionHeading
          id="finished-heading"
          eyebrow="Finished"
          icon={<CheckCircle2 className="size-3.5" aria-hidden="true" />}
          title={
            watchedItems.length > 0
              ? `${watchedItems.length} film${watchedItems.length === 1 ? "" : "s"} watched`
              : "Track what you&rsquo;ve watched"
          }
          description="Marking a film as watched also feeds the recommender, so the more you log, the sharper your picks get."
          action={
            watchedItems.length > 0 ? (
              <ConfirmingDestructiveButton
                label="Clear log"
                confirmLabel="Confirm clear"
                onConfirm={() => clearWatched()}
              />
            ) : null
          }
        />
        <MovieGrid
          movies={watchedMovies}
          density="default"
          emptyState={
            <EmptyState
              icon={<Eye className="size-6" aria-hidden="true" />}
              title="No finished films logged"
              description="Open any film detail page and tap “Mark as watched” to keep a running log here."
              cta={
                <Button asChild size="md" variant="secondary">
                  <Link href="/discover" className="inline-flex items-center gap-2">
                    Find something to watch
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
          }
        />
      </motion.section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Active profile card — avatar, rename, emoji picker, stats
// -----------------------------------------------------------------------------

interface ActiveProfileCardProps {
  name: string;
  emoji: string;
  createdAt: string;
  watchlistCount: number;
  watchedCount: number;
  onRename: (next: string) => void;
  onPickEmoji: (emoji: string) => void;
}

function ActiveProfileCard({
  name,
  emoji,
  createdAt,
  watchlistCount,
  watchedCount,
  onRename,
  onPickEmoji,
}: ActiveProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in sync if the active profile changes underneath us.
  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  const memberSince = useMemo(() => formatMemberSince(createdAt), [createdAt]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-xl">
      <div className="relative">
        {/* Subtle gradient hero */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-accent-violet/10 to-transparent"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 lg:p-8">
          {/* Avatar */}
          <div
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-brand-500/30 bg-bg/60 text-4xl shadow-glow sm:size-24 sm:text-5xl"
          >
            <span className="leading-none">{emoji}</span>
          </div>

          {/* Identity */}
          <div className="flex-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Currently signed in as
            </p>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commit();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancel();
                    }
                  }}
                  maxLength={32}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-2xl font-bold tracking-tight text-ink",
                    "placeholder:text-ink-subtle sm:text-3xl",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  )}
                  placeholder="Profile name"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={commit}
                  disabled={!draft.trim()}
                  aria-label="Save name"
                >
                  <Check className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancel}
                  aria-label="Cancel rename"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {name}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  className="gap-1.5"
                >
                  <Edit3 className="size-3.5" aria-hidden="true" />
                  Rename
                </Button>
              </div>
            )}
            <p className="text-sm text-ink-muted">{memberSince}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
            <StatTile
              label="Saved"
              value={watchlistCount}
              icon={<BookmarkPlus className="size-4" aria-hidden="true" />}
            />
            <StatTile
              label="Watched"
              value={watchedCount}
              icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
            />
          </div>
        </div>
      </div>

      {/* Emoji picker */}
      <div className="border-t border-border/60 bg-bg/40 px-6 py-5 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Avatar
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EMOJI_POOL.map((option) => {
            const active = option === emoji;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onPickEmoji(option)}
                aria-label={`Use ${option} as avatar`}
                aria-pressed={active}
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg border text-lg leading-none transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  active
                    ? "border-brand-500/70 bg-brand-500/15 shadow-glow"
                    : "border-border bg-surface hover:border-border-strong hover:bg-bg-elevated",
                )}
              >
                <span aria-hidden="true">{option}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-bg/50 p-3">
      <div className="flex items-center gap-1.5 text-ink-subtle">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Profile switcher — list every profile + inline create form
// -----------------------------------------------------------------------------

function ProfileSwitcher() {
  const profiles = useProfilesStore((s) => s.profiles);
  const activeProfileId = useProfilesStore((s) => s.activeProfileId);
  const switchProfile = useProfilesStore((s) => s.switchProfile);
  const deleteProfile = useProfilesStore((s) => s.deleteProfile);
  const createProfile = useProfilesStore((s) => s.createProfile);
  const hasMultiple = useProfilesStore((s) => s.hasMultiple());

  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const handleCreate = () => {
    const name = draftName.trim();
    if (!name) {
      setAdding(false);
      return;
    }
    createProfile(name);
    setDraftName("");
    setAdding(false);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => {
        const isActive = profile.id === activeProfileId;
        const isPendingDelete = pendingDelete === profile.id;
        return (
          <div
            key={profile.id}
            className={cn(
              "group relative flex flex-col gap-4 rounded-2xl border bg-surface/40 p-5 backdrop-blur-xl transition-colors",
              isActive
                ? "border-brand-500/40 bg-brand-500/5"
                : "border-border/60 hover:border-border-strong",
            )}
          >
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl border text-2xl leading-none",
                  isActive
                    ? "border-brand-500/50 bg-brand-500/10 shadow-glow"
                    : "border-border bg-bg/60",
                )}
              >
                {profile.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-ink">
                  {profile.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  {formatMemberSince(profile.createdAt)}
                </p>
                {isActive && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                    <Check className="size-3" aria-hidden="true" />
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isActive && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => switchProfile(profile.id)}
                  className="flex-1"
                >
                  Switch to this profile
                </Button>
              )}
              {isActive && (
                <span className="flex-1 rounded-md border border-dashed border-border/70 px-3 py-1.5 text-center text-xs text-ink-subtle">
                  You&apos;re here
                </span>
              )}
              {hasMultiple && (
                <Button
                  size="sm"
                  variant={isPendingDelete ? "destructive" : "ghost"}
                  onClick={() => {
                    if (isPendingDelete) {
                      deleteProfile(profile.id);
                      setPendingDelete(null);
                    } else {
                      setPendingDelete(profile.id);
                    }
                  }}
                  onBlur={() => setPendingDelete(null)}
                  aria-label={
                    isPendingDelete
                      ? `Confirm delete ${profile.name}`
                      : `Delete ${profile.name}`
                  }
                >
                  {isPendingDelete ? (
                    <>
                      <Check className="size-3.5" aria-hidden="true" />
                      <span className="ml-1.5">Confirm</span>
                    </>
                  ) : (
                    <Trash2 className="size-4" aria-hidden="true" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add profile tile */}
      <div
        className={cn(
          "flex flex-col justify-center gap-3 rounded-2xl border border-dashed bg-bg/30 p-5 backdrop-blur-xl transition-colors",
          adding
            ? "border-brand-500/40 bg-brand-500/5"
            : "border-border hover:border-border-strong",
        )}
      >
        {adding ? (
          <div className="space-y-3">
            <label
              htmlFor="new-profile-name"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-subtle"
            >
              New profile name
            </label>
            <input
              id="new-profile-name"
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreate();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setAdding(false);
                  setDraftName("");
                }
              }}
              placeholder="e.g. Mia"
              maxLength={32}
              className={cn(
                "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink",
                "placeholder:text-ink-subtle",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              )}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleCreate}
                disabled={!draftName.trim()}
                className="flex-1"
              >
                <Plus className="size-4" aria-hidden="true" />
                <span className="ml-1.5">Create profile</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setDraftName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-3 py-6 text-ink-muted transition-colors",
              "hover:text-ink focus-visible:outline-none focus-visible:text-ink",
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-xl border border-dashed border-border bg-bg/40 text-ink-subtle"
            >
              <UserPlus className="size-5" />
            </span>
            <span className="text-sm font-medium">Add a new profile</span>
            <span className="text-xs text-ink-subtle">
              Separate watchlist, ratings, and recs
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Small presentational helpers
// -----------------------------------------------------------------------------

interface SectionHeadingProps {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  icon,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
          {icon}
          {eyebrow}
        </span>
        <h2
          id={id}
          className="text-xl font-bold tracking-tight text-ink sm:text-2xl"
        >
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-ink-muted">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: React.ReactNode;
}

function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/30 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-xl border border-border bg-bg/60 text-ink-muted"
      >
        {icon}
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-md text-sm text-ink-muted">{description}</p>
      {cta ? <div className="mt-2">{cta}</div> : null}
    </div>
  );
}

interface ConfirmingDestructiveButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/** Two-step destructive button — first click arms it, second click commits. */
function ConfirmingDestructiveButton({
  label,
  confirmLabel,
  onConfirm,
}: ConfirmingDestructiveButtonProps) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      size="sm"
      variant={armed ? "destructive" : "ghost"}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
      className="gap-1.5"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      {armed ? confirmLabel : label}
    </Button>
  );
}

// -----------------------------------------------------------------------------
// SSR skeleton
// -----------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="h-5 w-24 rounded-full bg-surface/60" />
        <div className="h-10 w-72 rounded-lg bg-surface/60" />
        <div className="h-4 w-96 rounded-lg bg-surface/40" />
      </div>
      <div className="h-44 rounded-2xl border border-border/60 bg-surface/40" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 rounded-2xl border border-border/60 bg-surface/40" />
        <div className="h-40 rounded-2xl border border-border/60 bg-surface/40" />
        <div className="h-40 rounded-2xl border border-dashed border-border bg-surface/30" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-28 rounded-full bg-surface/60" />
        <div className="h-7 w-64 rounded-lg bg-surface/60" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl border border-border/60 bg-surface/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

/**
 * Human-friendly "member since" string.
 *
 * The default profile is seeded with `new Date(0)` so a 1970 date would leak.
 * In that case we soft-label it as "Original profile" instead.
 */
function formatMemberSince(createdAt: string): string {
  const ts = Date.parse(createdAt);
  if (!Number.isFinite(ts) || ts <= 0) return "Original profile";
  const date = new Date(ts);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  });
  return `Member since ${formatter.format(date)}`;
}
