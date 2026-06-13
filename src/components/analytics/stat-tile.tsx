/**
 * StatTile — compact KPI card used in the profile analytics header strip.
 *
 * Surfaces a single headline metric (e.g. "Movies watched", "Average rating")
 * with an optional icon, supporting copy, and a delta indicator that arrows
 * up or down depending on sign. Designed to be composed into a horizontally
 * scrolling row of 3–5 tiles at the top of the profile dashboard.
 */
"use client";

import type { ComponentType, ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

export interface StatTileProps {
  /** Headline label (e.g. "Watched"). */
  label: string;
  /** Primary value — already formatted by the caller (`formatRating`, etc.). */
  value: ReactNode;
  /** Optional supporting line under the value. */
  hint?: ReactNode;
  /** Lucide icon shown in the top-right corner. */
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  /** Percentage delta vs. the previous period. Positive => up, negative => down. */
  delta?: number;
  /** Subtle accent tone applied to the icon chip. */
  tone?: "brand" | "success" | "danger" | "warning" | "info";
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  brand: "text-brand-300 bg-brand-500/10 border-brand-500/30",
  success: "text-success bg-success/10 border-success/30",
  danger: "text-danger bg-danger/10 border-danger/30",
  warning: "text-warning bg-warning/10 border-warning/30",
  info: "text-info bg-info/10 border-info/30",
};

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  tone = "brand",
  className,
}: StatTileProps) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-ink tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{hint}</p>
          ) : null}
          {typeof delta === "number" ? <DeltaPill delta={delta} /> : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md",
              toneClasses,
            )}
            aria-hidden="true"
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.005) return null;
  const positive = delta > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const tone = positive ? "text-success" : "text-danger";
  return (
    <p className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", tone)}>
      <Icon className="size-3" aria-hidden="true" />
      <span className="tabular-nums">
        {positive ? "+" : ""}
        {Math.round(delta * 100)}%
      </span>
      <span className="text-ink-muted">vs. last month</span>
    </p>
  );
}
