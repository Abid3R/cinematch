/**
 * `useDebouncedValue` — return a value that only updates after `delay` ms of stability.
 *
 * Used by the search and command-palette hooks to avoid hammering TMDB on every
 * keystroke. Kept as its own tiny module so non-query callers (e.g. the
 * command palette's local filter) can reuse it.
 */

"use client";

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
