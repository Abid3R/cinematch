/**
 * Analytics components barrel.
 *
 * Single import surface for the profile-page analytics dashboard. Individual
 * components remain in their own files so consumers can compose a custom
 * layout (e.g. embedding just the GenreDistribution donut on the home page)
 * without pulling in Recharts dependencies they don't need.
 */

export { StatTile } from "./stat-tile";
export type { StatTileProps } from "./stat-tile";

export { GenreDistribution } from "./genre-distribution";
export type { GenreDistributionProps } from "./genre-distribution";

export { RatingHistogram } from "./rating-histogram";
export type { RatingHistogramProps } from "./rating-histogram";

export { ViewingActivity } from "./viewing-activity";
export type { ViewingActivityProps } from "./viewing-activity";

export { TasteRadar } from "./taste-radar";
export type { TasteRadarProps } from "./taste-radar";

export { AnalyticsDashboard } from "./analytics-dashboard";
export type { AnalyticsDashboardProps } from "./analytics-dashboard";
