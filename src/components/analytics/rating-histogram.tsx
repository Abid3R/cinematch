/**
 * RatingHistogram — bar chart of how the user distributes their ratings.
 *
 * Buckets every entry from `useRatingsStore` into ten integer bins (1..10),
 * then renders them as a brand-gradient bar chart. A small footer surfaces
 * the average rating and total entries so the visual reads at a glance.
 */
"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRatingsStore } from "@/store/ratings";
import { cn } from "@/utils/cn";
import { formatRating } from "@/utils/format";

export interface RatingHistogramProps {
  className?: string;
}

export function RatingHistogram({ className }: RatingHistogramProps) {
  const items = useRatingsStore((s) => s.items);
  const average = useRatingsStore((s) => s.averageRating());

  const data = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({
      bucket: `${i + 1}`,
      count: 0,
    }));
    for (const entry of items) {
      // Map [0.5, 10] -> bin [1..10], rounding up (so 7.5 lands in the "8" bucket).
      const idx = Math.min(9, Math.max(0, Math.ceil(entry.rating) - 1));
      bins[idx].count += 1;
    }
    return bins;
  }, [items]);

  const maxCount = data.reduce((m, d) => Math.max(m, d.count), 0);
  const empty = items.length === 0;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Rating distribution</CardTitle>
        <CardDescription>
          {empty
            ? "Rate a few films to see how generous your scoring runs."
            : `${items.length} rated · avg ${formatRating(average ?? 0)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {empty ? (
          <EmptyState />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="ratingBarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="bucket"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(232,234,240,0.55)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tick={{ fill: "rgba(232,234,240,0.45)", fontSize: 11 }}
                  domain={[0, Math.max(1, maxCount)]}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(124,92,255,0.08)" }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value} film${value === 1 ? "" : "s"}`, "Count"]}
                  labelFormatter={(label) => `Rating ${label}`}
                />
                <Bar
                  dataKey="count"
                  fill="url(#ratingBarFill)"
                  radius={[6, 6, 2, 2]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
      <p className="text-sm font-medium text-ink">No ratings yet</p>
      <p className="mt-1 max-w-[24ch] text-xs text-ink-muted">
        Your distribution will appear as you rate films.
      </p>
    </div>
  );
}
