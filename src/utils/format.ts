/**
 * Display formatters.
 *
 * All formatters are pure, locale-aware where it matters, and tolerant of
 * missing / malformed inputs (return a sensible fallback rather than throw).
 */

import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/constants/site";

// -----------------------------------------------------------------------------
// Runtime — minutes → "2h 28m"
// -----------------------------------------------------------------------------

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// -----------------------------------------------------------------------------
// Currency — 160000000 → "$160M"
// -----------------------------------------------------------------------------

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
): string {
  if (amount === null || amount === undefined || amount === 0) return "—";

  const formatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return formatter.format(amount);
}

// -----------------------------------------------------------------------------
// Date — "2014-03-14" → "March 14, 2014"
// -----------------------------------------------------------------------------

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// -----------------------------------------------------------------------------
// Year — "2014-03-14" → "2014"
// -----------------------------------------------------------------------------

export function formatYear(iso: string | null | undefined): string {
  if (!iso) return "";
  const year = iso.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}

// -----------------------------------------------------------------------------
// Compact counts — 2345 → "2.3K", 1_200_000 → "1.2M"
// -----------------------------------------------------------------------------

export function formatVoteCount(count: number | null | undefined): string {
  if (count === null || count === undefined) return "0";
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

// -----------------------------------------------------------------------------
// Ratings — 7.834 → "7.8"
// -----------------------------------------------------------------------------

export function formatRating(vote: number | null | undefined): string {
  if (vote === null || vote === undefined) return "—";
  return vote.toFixed(1);
}

// -----------------------------------------------------------------------------
// Percent — 0.83 → "83%"
// -----------------------------------------------------------------------------

export function formatPercent(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

// -----------------------------------------------------------------------------
// Relative time — ISO → "3 days ago", "in 2 weeks"
// -----------------------------------------------------------------------------

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const rtf = new Intl.RelativeTimeFormat(DEFAULT_LOCALE, { numeric: "auto" });
  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return rtf.format(Math.round(duration), "year");
}

// -----------------------------------------------------------------------------
// Title list — ["Action", "Thriller", "Sci-Fi"] → "Action, Thriller & Sci-Fi"
// -----------------------------------------------------------------------------

export function formatList(items: string[], type: "conjunction" | "disjunction" = "conjunction"): string {
  if (items.length === 0) return "";
  return new Intl.ListFormat(DEFAULT_LOCALE, { style: "long", type }).format(items);
}

// -----------------------------------------------------------------------------
// Truncate — "Long text..." (preserves word boundaries)
// -----------------------------------------------------------------------------

export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  const sliced = text.slice(0, max).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  return `${lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced}…`;
}
