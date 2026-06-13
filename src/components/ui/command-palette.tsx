/**
 * Command palette — ⌘K / Ctrl+K modal search.
 *
 * Composition over abstraction:
 *  - `Dialog` provides the portal + scroll-lock + ESC behavior.
 *  - `useSearchMulti` provides the debounced TMDB results.
 *  - This file wires keyboard navigation (↑/↓ to move, Enter to open) and
 *    routes the selection to `/movie/[id]` (or `/person/[id]` for cast).
 *
 * Mounted once at the root layout. Open it with the imperative API:
 *
 *   commandPalette.open();
 *
 * or via the global keybinding handled inside this file.
 */
"use client";

import { motion } from "framer-motion";
import { Film, Loader2, Search, Tv, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { create } from "zustand";

import { useSearchMulti } from "@/hooks/queries";
import type { MultiSearchResult } from "@/services/tmdb";
import { cn } from "@/utils/cn";
import { getPosterUrl, getProfileUrl } from "@/utils/image";

import { Dialog, DialogContent } from "./dialog";

// -----------------------------------------------------------------------------
// Imperative store — open the palette from anywhere (navbar button, hotkey).
// -----------------------------------------------------------------------------

interface CommandPaletteStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const useCommandPaletteStore = create<CommandPaletteStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

export const commandPalette = {
  open: () => useCommandPaletteStore.getState().setOpen(true),
  close: () => useCommandPaletteStore.getState().setOpen(false),
  toggle: () => useCommandPaletteStore.getState().toggle(),
};

export function useCommandPalette() {
  return useCommandPaletteStore();
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface PaletteItem {
  id: number;
  type: "movie" | "tv" | "person";
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

function toPaletteItem(result: MultiSearchResult): PaletteItem | null {
  if (result.media_type === "movie") {
    const year = result.release_date ? result.release_date.slice(0, 4) : "";
    return {
      id: result.id,
      type: "movie",
      title: result.title || result.original_title || "Untitled",
      subtitle: year ? `Movie · ${year}` : "Movie",
      image: getPosterUrl(result.poster_path, "sm"),
      href: `/movie/${result.id}`,
    };
  }
  if (result.media_type === "tv") {
    const year = result.first_air_date ? result.first_air_date.slice(0, 4) : "";
    return {
      id: result.id,
      type: "tv",
      title: result.name || result.original_name || "Untitled",
      subtitle: year ? `TV · ${year}` : "TV",
      image: getPosterUrl(result.poster_path, "sm"),
      href: `/tv/${result.id}`,
    };
  }
  if (result.media_type === "person") {
    const known = result.known_for
      ?.slice(0, 2)
      .map((k) => k.title)
      .filter(Boolean)
      .join(", ");
    return {
      id: result.id,
      type: "person",
      title: result.name,
      subtitle: known ? `Person · ${known}` : "Person",
      image: getProfileUrl(result.profile_path, "sm"),
      href: `/person/${result.id}`,
    };
  }
  return null;
}

const typeIcon: Record<PaletteItem["type"], JSX.Element> = {
  movie: <Film className="size-3.5" />,
  tv: <Tv className="size-3.5" />,
  person: <User className="size-3.5" />,
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function CommandPalette(): JSX.Element {
  const router = useRouter();
  const { open, setOpen } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Global hotkey: ⌘K / Ctrl+K to toggle.
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const isToggle =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isToggle) {
        event.preventDefault();
        useCommandPaletteStore.getState().toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset on open/close so each visit starts fresh.
  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      // Focus the input after the dialog finishes its open transition.
      const handle = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(handle);
    } else {
      setQuery("");
    }
  }, [open]);

  const { data, isFetching } = useSearchMulti(query, {
    enabled: open,
    minLength: 2,
  });

  const items = useMemo<PaletteItem[]>(() => {
    const raw = data?.results ?? [];
    const mapped: PaletteItem[] = [];
    for (const result of raw) {
      const item = toPaletteItem(result);
      if (item) mapped.push(item);
      if (mapped.length >= 12) break;
    }
    return mapped;
  }, [data]);

  // Clamp active index whenever the result set changes.
  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [items.length, activeIndex]);

  const navigateTo = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router, setOpen],
  );

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, items.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) navigateTo(item);
    }
  }

  // Scroll active item into view as the user navigates.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index='${activeIndex}']`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const trimmed = query.trim();
  const showEmpty = open && trimmed.length >= 2 && !isFetching && items.length === 0;
  const showHint = open && trimmed.length < 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xl overflow-hidden p-0"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 text-ink-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search movies, shows, people..."
            aria-label="Search"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          {isFetching ? (
            <Loader2
              className="size-4 animate-spin text-ink-muted"
              aria-hidden="true"
            />
          ) : (
            <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted sm:inline-block">
              ESC
            </kbd>
          )}
        </div>

        <div
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {showHint ? (
            <div className="px-3 py-8 text-center text-sm text-ink-subtle">
              Start typing to search the catalog
              <div className="mt-2 flex justify-center gap-1.5 text-[11px] text-ink-subtle/80">
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  ↑
                </kbd>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  ↓
                </kbd>
                <span>to navigate</span>
                <kbd className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  ↵
                </kbd>
                <span>to open</span>
              </div>
            </div>
          ) : null}

          {showEmpty ? (
            <div className="px-3 py-8 text-center text-sm text-ink-subtle">
              No matches for &ldquo;{trimmed}&rdquo;
            </div>
          ) : null}

          {items.map((item, index) => {
            const active = index === activeIndex;
            return (
              <motion.button
                key={`${item.type}-${item.id}`}
                type="button"
                role="option"
                aria-selected={active}
                data-index={index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigateTo(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  active ? "bg-surface text-ink" : "text-ink-muted hover:text-ink",
                )}
                whileTap={{ scale: 0.99 }}
              >
                <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-bg-subtle">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-subtle">
                    {typeIcon[item.type]}
                    <span className="truncate">{item.subtitle}</span>
                  </div>
                </div>
                {active ? (
                  <kbd className="hidden rounded border border-border bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-muted sm:inline-block">
                    ↵
                  </kbd>
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
