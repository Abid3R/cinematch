/**
 * Movie components barrel.
 *
 * Single import surface (`@/components/movie`) for all movie-presentation
 * components. Keeping individual files lets us tree-shake unused variants and
 * keeps each component's concerns isolated; the barrel exists purely so
 * page-level code reads cleanly.
 */

export { MoviePoster } from "./movie-poster";
export type { MoviePosterProps } from "./movie-poster";

export { MovieCard, MovieCardSkeleton } from "./movie-card";
export type { MovieCardProps, MovieCardData } from "./movie-card";

export { MovieRow } from "./movie-row";
export type { MovieRowProps } from "./movie-row";

export { MovieGrid } from "./movie-grid";
export type { MovieGridProps } from "./movie-grid";

export { MovieBanner, MovieBannerSkeleton } from "./movie-banner";
export type { MovieBannerProps } from "./movie-banner";
