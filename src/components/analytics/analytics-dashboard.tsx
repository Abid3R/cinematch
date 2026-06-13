/**
 * AnalyticsDashboard — composes the full profile analytics surface.
 *
 * Layout:
 *  - A responsive strip of StatTiles at the top (watchlist count, ratings,
 *    average rating, signal count).
 *  - A two-column charts grid (Genre + Rating, then Activity + Taste).
 *
 * The dashboard is intentionally store-first — each child reads its own slice
 * from Zustand so the dashboard works with no props on the user profile page,
 * while still allowing the parent to inject an explicit `UserProfile` for the
 * taste radar (computed off the recommendation engine's user-profile builder).
 */
"use client";

import { Clock, Eye, Heart, Star, Sparkles } from "lucide-react";

import { useLikesStore } from "@/store/likes";
import { useRatingsStore } from "@/store/ratings";
import { useViewHistoryStore } from "@/store/view-history";
import { useWatchlistStore } from "@/store/watchlist";
import { cn } from "@/utils/cn";
import { formatRating } from "@/utils/format";
import type { UserProfile } from "@/types/recommendation";

import { GenreDistribution } from "./genre-distribution";
import { RatingHistogram } from "./rating-histogram";
import { StatTile } from "./stat-tile";
import { TasteRadar } from "./taste-radar";
import { ViewingActivity } from "./viewing-activity";

export interface AnalyticsDashboardProps {
  /** Optional pre-computed taste profile; required for the radar to render. */
  profile?: UserProfile | null;
  className?: string;
}

export function AnalyticsDashboard({ profile, className }: AnalyticsDashboardProps) {
  const watchlistCount = useWatchlistStore((s) => s.items.length);
  const likeCount = useLikesStore((s) => s.items.filter((i) => i.state === "liked").length);
  const ratingsCount = useRatingsStore((s) => s.items.length);
  const avgRating = useRatingsStore((s) => s.averageRating());
  const viewsCount = useViewHistoryStore((s) =>
    s.items.reduce((sum, v) => sum + v.views, 0),
  );

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatTile
          label="Watchlist"
          value={watchlistCount}
          hint="Films queued up"
          icon={Clock}
          tone="brand"
        />
        <StatTile
          label="Likes"
          value={likeCount}
          hint="Marked as loved"
          icon={Heart}
          tone="danger"
        />
        <StatTile
          label="Avg rating"
          value={avgRating != null ? formatRating(avgRating) : "—"}
          hint={`${ratingsCount} rated`}
          icon={Star}
          tone="warning"
        />
        <StatTile
          label="Views"
          value={viewsCount}
          hint="Across all time"
          icon={Eye}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GenreDistribution />
        <RatingHistogram />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ViewingActivity />
        <TasteRadar profile={profile} />
      </div>

      <SignalHint profile={profile} />
    </div>
  );
}

function SignalHint({ profile }: { profile: UserProfile | null | undefined }) {
  if (!profile || profile.signalCount >= 5) return null;
  return (
    <p className="flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/5 px-4 py-3 text-sm text-ink-muted">
      <Sparkles className="size-4 text-brand-300" aria-hidden="true" />
      <span>
        Your charts will sharpen as you rate, like, and explore more films — the engine
        learns from every signal.
      </span>
    </p>
  );
}
