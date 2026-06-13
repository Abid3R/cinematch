/**
 * ScoreBadge — circular match-percentage badge surfaced next to a recommended
 * movie's title/poster.
 *
 * Visually encodes confidence at a glance:
 *   - Track ring (subtle border) + progress arc (brand gradient) drawn with SVG
 *   - Centered numeric percentage
 *   - Optional tooltip that breaks down the per-facet contributions
 *
 * The score input is the engine's `ScoreBreakdown.total` (0..1). When a full
 * breakdown is passed, hovering the badge reveals each facet's contribution so
 * users can see *why* the engine surfaced this title.
 */
"use client";

import { cn } from "@/utils/cn";
import { formatPercent } from "@/utils/format";
import { Tooltip } from "@/components/ui/tooltip";
import type { ScoreBreakdown } from "@/types/recommendation";

export interface ScoreBadgeProps {
  /** Either the total score (0..1) or the full breakdown. */
  score: number | ScoreBreakdown;
  /** Visual size — `sm` for inline rows, `md` for cards, `lg` for hero. */
  size?: "sm" | "md" | "lg";
  /** Hide the surrounding tooltip wrapper. */
  noTooltip?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 36, stroke: 3, font: "text-[10px]" },
  md: { box: 52, stroke: 4, font: "text-xs" },
  lg: { box: 72, stroke: 5, font: "text-sm" },
} as const;

export function ScoreBadge({
  score,
  size = "md",
  noTooltip = false,
  className,
}: ScoreBadgeProps) {
  const total = typeof score === "number" ? score : score.total;
  const breakdown = typeof score === "number" ? null : score;
  const clamped = Math.max(0, Math.min(1, total));

  const { box, stroke, font } = SIZE_MAP[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  const tone = toneForScore(clamped);

  const ring = (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: box, height: box }}
      role="img"
      aria-label={`Recommendation match ${Math.round(clamped * 100)} percent`}
    >
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="transparent"
          strokeWidth={stroke}
          className="stroke-bg-subtle/60"
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-700 ease-spring", tone.stroke)}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold tabular-nums",
          font,
          tone.text,
        )}
      >
        {Math.round(clamped * 100)}
      </span>
    </div>
  );

  if (noTooltip || !breakdown) return ring;

  return (
    <Tooltip content={<BreakdownContent breakdown={breakdown} />}>
      {ring}
    </Tooltip>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function toneForScore(score: number) {
  if (score >= 0.8) return { stroke: "stroke-success", text: "text-success" };
  if (score >= 0.6) return { stroke: "stroke-brand-400", text: "text-brand-300" };
  if (score >= 0.4) return { stroke: "stroke-warning", text: "text-warning" };
  return { stroke: "stroke-ink-muted", text: "text-ink-muted" };
}

function BreakdownContent({ breakdown }: { breakdown: ScoreBreakdown }) {
  const rows: Array<{ label: string; value: number }> = [
    { label: "Genre", value: breakdown.genre },
    { label: "Cast", value: breakdown.actor },
    { label: "Director", value: breakdown.director },
    { label: "Keywords", value: breakdown.keyword },
    { label: "Popularity", value: breakdown.popularity },
  ];

  return (
    <div className="flex w-44 flex-col gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        Match breakdown
      </p>
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-[11px]">
            <span className="w-16 text-ink-muted">{row.label}</span>
            <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-bg-subtle/60">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
                style={{ width: `${Math.round(row.value * 100)}%` }}
              />
            </span>
            <span className="w-7 text-right tabular-nums text-ink">
              {formatPercent(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
