/**
 * Recommendation engine — public barrel.
 *
 * The single import surface for the rest of the app. Anything not re-exported
 * here is considered internal implementation detail and may change without
 * notice. Keep this file curated.
 */

// Types -----------------------------------------------------------------------
export type {
  RecommendOptions,
  RecommendationReason,
  ScoreBreakdown,
  ScoredRecommendation,
  UserProfile,
  UserSignal,
  UserSignalSources,
  UserSignalType,
} from "./types";

// Profile ---------------------------------------------------------------------
export { buildUserProfile, emptyUserProfile } from "./profile";

// Scoring ---------------------------------------------------------------------
export { scoreCandidate } from "./scoring";
export type { ScoreContext, ScoreResult } from "./scoring";

// Explanations ----------------------------------------------------------------
export { generateReasons } from "./explanations";

// Hidden gems -----------------------------------------------------------------
export { hiddenGemScore, isHiddenGem } from "./hidden-gems";

// Orchestrator ----------------------------------------------------------------
export { rankSimilar, recommend, recommendHiddenGems } from "./engine";

// Natural-language (stub) -----------------------------------------------------
export {
  isNaturalLanguageRecommendEnabled,
  naturalLanguageRecommend,
} from "./openai-placeholder";
export type {
  NaturalLanguageRecommendInput,
  NaturalLanguageRecommendResult,
} from "./openai-placeholder";

// Tunables --------------------------------------------------------------------
export {
  COLD_START_THRESHOLD,
  COMPONENT_WEIGHTS,
  HIDDEN_GEM_CRITERIA,
  POPULARITY_LOG_BASE,
  RECENCY_HALF_LIFE_DAYS,
  SIGNAL_WEIGHTS,
  TOP_CAST_COUNT,
} from "./weights";
