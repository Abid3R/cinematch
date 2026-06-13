/**
 * ReasonChips — the explanation pills surfaced beneath a recommended title.
 *
 * Each chip pairs a kind-specific icon with a short human label sourced from
 * the engine (e.g. "Because you watched Inception", "You enjoy Sci-fi").
 *
 * Variants:
 *  - `stack`  : wraps onto multiple lines (used on cards and detail pages)
 *  - `scroll` : single horizontal line that scrolls (used inside compact rows)
 *
 * Chips are non-interactive by default but accept an `onSelect` callback for
 * filter surfaces where each reason becomes a clickable refinement.
 */
"use client";

import {
  Clapperboard,
  Film,
  Flame,
  Gem,
  Globe2,
  Sparkles,
  Tag,
  User,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";
import type { ReasonKind, RecommendationReason } from "@/types/recommendation";

export interface ReasonChipsProps {
  reasons: RecommendationReason[];
  /** Cap visible chips; extras roll up into a "+N more" pill. */
  max?: number;
  variant?: "stack" | "scroll";
  size?: "sm" | "md";
  onSelect?: (reason: RecommendationReason) => void;
  className?: string;
}

const KIND_ICON: Record<ReasonKind, LucideIcon> = {
  genre: Film,
  actor: User,
  director: Clapperboard,
  keyword: Tag,
  language: Globe2,
  similar: Wand2,
  trending: Flame,
  "hidden-gem": Gem,
  "cold-start": Sparkles,
};

const KIND_TONE: Record<ReasonKind, string> = {
  genre: "text-brand-300 border-brand-500/30 bg-brand-500/10",
  actor: "text-info border-info/30 bg-info/10",
  director: "text-warning border-warning/30 bg-warning/10",
  keyword: "text-ink-muted border-border bg-bg-subtle/60",
  language: "text-ink-muted border-border bg-bg-subtle/60",
  similar: "text-brand-300 border-brand-500/30 bg-brand-500/10",
  trending: "text-danger border-danger/30 bg-danger/10",
  "hidden-gem": "text-success border-success/30 bg-success/10",
  "cold-start": "text-ink-muted border-border bg-bg-subtle/60",
};

export function ReasonChips({
  reasons,
  max,
  variant = "stack",
  size = "md",
  onSelect,
  className,
}: ReasonChipsProps) {
  if (!reasons || reasons.length === 0) return null;

  const visible = typeof max === "number" ? reasons.slice(0, max) : reasons;
  const overflow = typeof max === "number" ? Math.max(0, reasons.length - max) : 0;

  return (
    <ul
      className={cn(
        variant === "stack"
          ? "flex flex-wrap gap-1.5"
          : "flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label="Reasons we recommend this"
    >
      {visible.map((reason, i) => (
        <li key={`${reason.kind}-${i}`} className={variant === "scroll" ? "shrink-0" : undefined}>
          <Chip reason={reason} size={size} onSelect={onSelect} />
        </li>
      ))}
      {overflow > 0 ? (
        <li className={variant === "scroll" ? "shrink-0" : undefined}>
          <span
            className={cn(
              "inline-flex items-center rounded-full border border-border bg-bg-subtle/60 text-ink-muted",
              size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
            )}
          >
            +{overflow} more
          </span>
        </li>
      ) : null}
    </ul>
  );
}

interface ChipProps {
  reason: RecommendationReason;
  size: "sm" | "md";
  onSelect?: (reason: RecommendationReason) => void;
}

function Chip({ reason, size, onSelect }: ChipProps) {
  const Icon = KIND_ICON[reason.kind] ?? Sparkles;
  const tone = KIND_TONE[reason.kind];
  const base = cn(
    "inline-flex items-center gap-1.5 rounded-full border font-medium backdrop-blur-md transition-colors",
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
    tone,
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(reason)}
        className={cn(base, "hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70")}
      >
        <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />
        <span>{reason.label}</span>
      </button>
    );
  }

  return (
    <span className={base}>
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />
      <span>{reason.label}</span>
    </span>
  );
}
