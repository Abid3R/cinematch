/**
 * Recommendation components barrel.
 *
 * Aggregates the recommendation-presentation surface so pages can import from
 * a single path. Each component remains in its own file to keep concerns
 * isolated and to let Next.js tree-shake what individual pages don't use.
 */

export { ScoreBadge } from "./score-badge";
export type { ScoreBadgeProps } from "./score-badge";

export { ReasonChips } from "./reason-chips";
export type { ReasonChipsProps } from "./reason-chips";

export { RecommendationSection } from "./recommendation-section";
export type { RecommendationSectionProps } from "./recommendation-section";
