/**
 * ProfileMenu — navbar avatar dropdown for switching between profiles.
 *
 * Renders the active profile's emoji as a navbar icon button. Clicking opens a
 * popover listing every saved profile (active one marked with a check), plus
 * inline controls to create a new profile and a link to the manage screen.
 *
 * The dropdown is purely client-side state — selecting a profile delegates to
 * `useProfilesStore.switchProfile()`, which the profile-scoped registry hooks
 * into to re-key every persisted store on the fly.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Settings2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProfilesStore } from "@/store/profiles";
import { cn } from "@/utils/cn";

export interface ProfileMenuProps {
  className?: string;
}

export function ProfileMenu({ className }: ProfileMenuProps) {
  const profiles = useProfilesStore((s) => s.profiles);
  const activeProfileId = useProfilesStore((s) => s.activeProfileId);
  const switchProfile = useProfilesStore((s) => s.switchProfile);
  const createProfile = useProfilesStore((s) => s.createProfile);

  // Avoid SSR / hydration mismatch on emoji & profile data.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the input when entering creation mode.
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const active = mounted
    ? profiles.find((p) => p.id === activeProfileId) ?? profiles[0]
    : null;

  const handleSwitch = (id: string) => {
    switchProfile(id);
    setOpen(false);
  };

  const handleCreate = () => {
    const name = draftName.trim();
    if (!name) {
      setCreating(false);
      return;
    }
    createProfile(name);
    setDraftName("");
    setCreating(false);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={
          active
            ? `Profile: ${active.name}. Open profile menu.`
            : "Open profile menu"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-base transition-colors",
          "hover:border-border-strong hover:bg-bg-elevated",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          open && "border-border-strong bg-bg-elevated",
        )}
      >
        <span aria-hidden="true" className="leading-none">
          {active?.emoji ?? "🎬"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl",
              "border border-border bg-bg-elevated/95 shadow-xl backdrop-blur-xl",
            )}
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                Switch profile
              </p>
              {active && (
                <p className="mt-1 truncate text-sm text-ink-muted">
                  Signed in as{" "}
                  <span className="font-medium text-ink">{active.name}</span>
                </p>
              )}
            </div>

            <ul className="max-h-64 overflow-y-auto py-1">
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                return (
                  <li key={profile.id}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => handleSwitch(profile.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-surface focus-visible:outline-none focus-visible:bg-surface",
                        isActive ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg border border-border bg-bg text-base leading-none",
                          isActive &&
                            "border-brand-500/60 bg-brand-500/10 shadow-glow",
                        )}
                      >
                        {profile.emoji}
                      </span>
                      <span className="flex-1 truncate font-medium">
                        {profile.name}
                      </span>
                      {isActive && (
                        <Check
                          className="size-4 text-brand-500"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-border p-2">
              {creating ? (
                <div className="flex items-center gap-2">
                  <input
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
                        setCreating(false);
                        setDraftName("");
                      }
                    }}
                    placeholder="Profile name"
                    maxLength={32}
                    className={cn(
                      "flex-1 rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm text-ink",
                      "placeholder:text-ink-subtle",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    )}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!draftName.trim()}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setCreating(true)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-ink-muted transition-colors",
                    "hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:bg-surface",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-8 items-center justify-center rounded-lg border border-dashed border-border text-ink-subtle"
                  >
                    <UserPlus className="size-4" />
                  </span>
                  <span className="font-medium">Add profile</span>
                </button>
              )}

              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "mt-1 flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-ink-muted transition-colors",
                  "hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:bg-surface",
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-lg border border-border bg-bg text-ink-subtle"
                >
                  <Settings2 className="size-4" />
                </span>
                <span className="font-medium">Manage profiles</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
