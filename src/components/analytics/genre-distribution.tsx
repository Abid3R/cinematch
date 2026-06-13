/**
 * GenreDistribution — pie chart of the user's most-watched genres.
 *
 * Aggregates `genre_ids` across liked movies, rated movies, and view history
 * into a frequency map, resolves ids to human labels via `DEFAULT_GENRE_MAP`,
 * and renders the top N slices in a glass-themed donut chart with a legend
 * showing each genre's share.
 */
"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_GENRE_MAP } from "@/constants/tmdb";
import { useLikesStore } from "@/store/likes";
import { useRatingsStore } from "@/store/ratings";
import { useViewHistoryStore } from "@/store/view-history";
import { cn } from "@/utils/cn";
import { formatPercent } from "@/utils/format";

export interface GenreDistributionProps {
  /** Maximum number of genre slices to show; the rest collapse into "Other". */
  topN?: number;
  className?: string;
}

/** Palette tuned to the dark cinematic theme; brand-led with accent variety. */
const GENRE_PALETTE = [
  "#7c5cff", // brand-500
  "#22d3ee", // info
  "#f97316", // warning
  "#34d399", // success
  "#f43f5e", // danger
  "#a78bfa",
  "#fbbf24",
  "#60a5fa",
  "#f472b6",
  "#94a3b8",
];

export function GenreDistribution({ topN = 8, className }: GenreDistributionProps) {
  const likes = useLikesStore((s) => s.items);
  const ratings = useRatingsStore((s) => s.items);
  const views = useViewHistoryStore((s) => s.items);

  const data = useMemo(() => {
    const counts = new Map<number, number>();

    // Weight likes most heavily, then high ratings, then views.
    for (const like of likes) {
      if (like.state !== "liked") continue;
      for (const gid of like.movie.genre_ids ?? []) {
        counts.set(gid, (counts.get(gid) ?? 0) + 2);
      }
    }
    for (const rating of ratings) {
      const w = rating.rating >= 7 ? 1.5 : rating.rating >= 5 ? 1 : 0.5;
      for (const gid of rating.movie.genre_ids ?? []) {
        counts.set(gid, (counts.get(gid) ?? 0) + w);
      }
    }
    for (const view of views) {
      for (const gid of view.movie.genre_ids ?? []) {
        counts.set(gid, (counts.get(gid) ?? 0) + Math.min(view.views, 3) * 0.5);
      }
    }

    if (counts.size === 0) return [] as Array<{ name: string; value: number; pct: number }>;

    const sorted = Array.from(counts.entries())
      .map(([id, count]) => ({
        name: DEFAULT_GENRE_MAP[id] ?? `Genre ${id}`,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);

    const head = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    if (rest.length > 0) {
      head.push({
        name: "Other",
        value: rest.reduce((sum, r) => sum + r.value, 0),
      });
    }

    const total = head.reduce((sum, h) => sum + h.value, 0) || 1;
    return head.map((h) => ({ ...h, pct: h.value / total }));
  }, [likes, ratings, views, topN]);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Genre breakdown</CardTitle>
        <CardDescription>
          Where your taste leans across everything you&apos;ve liked, rated, or watched.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    cursor={false}
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      `${formatPercent(value as number / (data.reduce((s, d) => s + d.value, 0) || 1))}`,
                      name,
                    ]}
                  />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={1}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={GENRE_PALETTE[i % GENRE_PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="grid grid-cols-2 gap-2 text-xs">
              {data.slice(0, 6).map((row, i) => (
                <li key={row.name} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: GENRE_PALETTE[i % GENRE_PALETTE.length] }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-ink">{row.name}</span>
                  <span className="shrink-0 tabular-nums text-ink-muted">
                    {formatPercent(row.pct)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: "rgba(15, 17, 24, 0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "#e8eaf0",
};

function EmptyState() {
  return (
    <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-subtle/40 text-center">
      <p className="text-sm font-medium text-ink">No genre data yet</p>
      <p className="mt-1 max-w-[20ch] text-xs text-ink-muted">
        Rate or like a few films and we&apos;ll chart your taste.
      </p>
    </div>
  );
}
