/**
 * ViewingActivity — area chart of the user's daily viewing momentum.
 *
 * Walks `useViewHistoryStore` for the last N days, bucketizes views per day,
 * and renders a smoothed area chart with a brand-gradient fill. A summary
 * caption above the chart shows the total views in the window and the
 * day-over-day trend so the visual reads even before tooltip interaction.
 */
"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
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
import { useViewHistoryStore } from "@/store/view-history";
import { cn } from "@/utils/cn";

export interface ViewingActivityProps {
  /** Trailing window size in days. Defaults to 30. */
  days?: number;
  className?: string;
}

export function ViewingActivity({ days = 30, className }: ViewingActivityProps) {
  const items = useViewHistoryStore((s) => s.items);

  const { data, total, peak } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets = new Map<string, number>();

    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets.set(toKey(d), 0);
    }

    for (const entry of items) {
      const viewedDay = new Date(entry.viewedAt);
      viewedDay.setHours(0, 0, 0, 0);
      const diffMs = now.getTime() - viewedDay.getTime();
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays < 0 || diffDays >= days) continue;
      const key = toKey(viewedDay);
      buckets.set(key, (buckets.get(key) ?? 0) + entry.views);
    }

    const series = Array.from(buckets.entries()).map(([key, value]) => ({
      day: key,
      label: formatTick(key),
      views: value,
    }));

    return {
      data: series,
      total: series.reduce((sum, d) => sum + d.views, 0),
      peak: series.reduce((m, d) => Math.max(m, d.views), 0),
    };
  }, [items, days]);

  const empty = total === 0;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Viewing activity</CardTitle>
        <CardDescription>
          {empty
            ? `Films you open will show up here across the last ${days} days.`
            : `${total} view${total === 1 ? "" : "s"} across the last ${days} days · peak ${peak}/day`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {empty ? (
          <EmptyState days={days} />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                  tick={{ fill: "rgba(232,234,240,0.45)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tick={{ fill: "rgba(232,234,240,0.45)", fontSize: 11 }}
                  domain={[0, Math.max(1, peak)]}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(124,92,255,0.4)", strokeWidth: 1 }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value} view${value === 1 ? "" : "s"}`, "Activity"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#activityFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#a78bfa", stroke: "#0f1118", strokeWidth: 2 }}
                />
              </AreaChart>
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

function toKey(d: Date) {
  // YYYY-MM-DD — stable, timezone-safe within the user's locale.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatTick(key: string) {
  const [, m, d] = key.split("-").map(Number);
  // "Jan 5"-style short label.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[m - 1]} ${d}`;
}

function EmptyState({ days }: { days: number }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-subtle/40 text-center">
      <p className="text-sm font-medium text-ink">No activity in the last {days} days</p>
      <p className="mt-1 max-w-[26ch] text-xs text-ink-muted">
        Browse a film and your activity will start charting.
      </p>
    </div>
  );
}
