/**
 * Natural-language recommendations — OpenAI placeholder.
 *
 * Reserved interface for the upcoming AI-powered query mode (e.g. "show me
 * cerebral sci-fi from the 70s that isn't Kubrick"). Wired into the command
 * palette as a disabled affordance today; flipped on once the integration
 * ships behind a feature flag.
 *
 * Planned implementation:
 *  1. Send `query` + a compact profile summary to OpenAI Responses API with a
 *     tool schema mirroring TMDB's `/discover/movie` query params.
 *  2. Execute the returned tool call against TMDB.
 *  3. Pass the resulting candidate pool through `recommend()` to apply the
 *     same hard filters and explanation chips as the rest of the engine.
 *  4. Stream a one-sentence rationale back to the UI alongside the results.
 *
 * Keeping this file in tree (even as a stub) makes the future surface area
 * obvious to anyone exploring the engine.
 */

import type { ScoredRecommendation, UserProfile } from "./types";

export interface NaturalLanguageRecommendInput {
  query: string;
  profile: UserProfile;
  /** Maximum results to return. Defaults to 20 when implemented. */
  limit?: number;
}

export interface NaturalLanguageRecommendResult {
  results: ScoredRecommendation[];
  /** Short, human-readable explanation of the interpretation. */
  rationale: string;
}

/**
 * Currently a typed stub. Throws until the OpenAI integration ships so any
 * accidental production call surfaces immediately instead of silently
 * returning empty results.
 */
export async function naturalLanguageRecommend(
  _input: NaturalLanguageRecommendInput,
): Promise<NaturalLanguageRecommendResult> {
  throw new Error(
    "naturalLanguageRecommend is not yet implemented. " +
      "Track the rollout in the recommendations roadmap.",
  );
}

/**
 * Feature-flag check used by the UI to decide whether to render the natural
 * language input affordance. Currently always returns `false`; once the
 * OpenAI integration is live this will read from an environment variable or
 * remote config.
 */
export function isNaturalLanguageRecommendEnabled(): boolean {
  return false;
}
