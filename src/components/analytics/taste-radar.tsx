/**
 * TasteRadar — radar chart visualizing the diversity of a user's profile.
 *
 * Consumes a `UserProfile` and projects each facet (genre, actor, director,
 * keyword, language) to a 0..1 "spread" score reflecting how varied the
 * user's taste is across that facet. A perfectly balanced taste fills the
 * radar; a narrow taste produces a sharp spike on the dominant facet.
 */
"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils/cn";
import type { UserProfile } from "@/types/recommendation";

export interface TasteRadarProps {
  profile: UserProfile | null | undefined;
  className?: string;
}

export function TasteRadar({ profile, className }: TasteRadarProps) {
  const data = useMemo(() => buildRadarData(profile), [profile]);

  const empty = !profile || profile.signalCount === 0;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Taste shape</CardTitle>
        <CardDescription>
          {empty
            ? "Your taste fingerprint will appear once you have a few signals."
            : `Profile built from ${profile?.signalCount ?? 0} signal${profile?.signalCount === 1 ? "" : "s"}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {empty ? (
          <EmptyState />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="78%">
                <defs>
                  <linearGradient id="tasteFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="facet"
                  tick={{ fill: "rgba(232,234,240,0.7)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 1]}
                  tick={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${Math.round(value * 100)}%`, "Diversity"]}
                />
                <Radar
                  name="Taste"
                  dataKey="value"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#tasteFill)"
                  fillOpacity={1}
                />
              </RadarChart>
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

interface RadarPoint {
  facet: string;
  value: number;
}

/**
 * Project a UserProfile's facet maps into a five-axis radar reading.
 *
 * For each facet we compute a normalized "spread" score in [0, 1]:
 *  - 0  => no signals in that facet
 *  - 1  => weights are uniformly distributed across many entities
 *
 * The score is `entropy(weights) / log(N)` (normalized Shannon entropy)
 * scaled by a presence factor so a single-genre user reads as a sharp
 * spike on Genre rather than a meaningless 100% across the board.
 */
function buildRadarData(profile: UserProfile | null | undefined): RadarPoint[] {
  if (!profile) {
    return [
      { facet: "Genre", value: 0 },
      { facet: "Cast", value: 0 },
      { facet: "Directors", value: 0 },
      { facet: "Themes", value: 0 },
      { facet: "Languages", value: 0 },
    ];
  }

  return [
    { facet: "Genre", value: facetScore(profile.genres) },
    { facet: "Cast", value: facetScore(profile.actors) },
    { facet: "Directors", value: facetScore(profile.directors) },
    { facet: "Themes", value: facetScore(profile.keywords) },
    { facet: "Languages", value: facetScore(profile.languages) },
  ];
}

function facetScore(weights: Record<string | number, number>): number {
  const values = Object.values(weights).filter((v) => v > 0);
  if (values.length === 0) return 0;

  const total = values.reduce((sum, v) => sum + v, 0) || 1;
  // Normalized Shannon entropy: in [0, 1] for >=2 entries; 0 for a single entry.
  let entropy = 0;
  for (const v of values) {
    const p = v / total;
    entropy -= p * Math.log(p);
  }
  const normalized = values.length > 1 ? entropy / Math.log(values.length) : 0;

  // Presence boost: a facet with only 1-2 entities still deserves visible
  // surface area on the radar; bias the score upward by sqrt(presence).
  const presence = Math.min(1, values.length / 8);
  return Math.max(0.05, Math.min(1, 0.4 * presence + 0.6 * normalized));
}

function EmptyState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-subtle/40 text-center">
      <p className="text-sm font-medium text-ink">No taste profile yet</p>
      <p className="mt-1 max-w-[24ch] text-xs text-ink-muted">
        Like, rate, or watchlist a few films to build your shape.
      </p>
    </div>
  );
}
