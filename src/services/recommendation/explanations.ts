/**
 * Reason-chip generator.
 *
 * Translates a `ScoreBreakdown` into the top 3 human-readable explanations
 * rendered alongside every recommendation ("Because you love Sci-Fi",
 * "Stars Christopher Nolan", etc.). Honest explanations are a core trust
 * mechanic for the recommendations product — never invent reasons that
 * aren't reflected in the score.
 */

import type { Movie, MovieDetails } from "@/types/tmdb";

import { isHiddenGem } from "./hidden-gems";
import type { RecommendationReason, ScoreBreakdown, UserProfile } from "./types";

// -----------------------------------------------------------------------------
// Helpers — find the single best matching entity in each category
// -----------------------------------------------------------------------------

interface TopMatch {
  id: number;
  name: string;
  weight: number;
}

/**
 * Among the candidate's entities (genres/cast/keywords), find the one with
 * the highest positive weight in the user profile.
 */
function bestMatch(
  candidateIds: number[],
  weights: Map<number, number>,
  names: Map<number, string>,
): TopMatch | null {
  let best: TopMatch | null = null;
  for (const id of candidateIds) {
    const w = weights.get(id);
    if (w == null || w <= 0) continue;
    if (best == null || w > best.weight) {
      best = { id, name: names.get(id) ?? "", weight: w };
    }
  }
  return best && best.name ? best : null;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Build up to 3 reason chips ordered by descending weight.
 *
 * Ordering rules:
 *  - Components are sorted by their breakdown score so the chip ordering
 *    matches the score's actual drivers.
 *  - At most one chip per category — no "Action + Action" stacking.
 *  - Hidden-gem chip is appended whenever the candidate qualifies, unless
 *    we already have 3 reasons.
 */
export function generateReasons(
  movie: Movie,
  details: MovieDetails | undefined,
  profile: UserProfile,
  breakdown: ScoreBreakdown,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];

  const genreIds = details
    ? details.genres?.map((g) => g.id) ?? []
    : movie.genre_ids;

  // Pair each component with its score so we can rank candidates by impact.
  const candidates: Array<{
    component: keyof ScoreBreakdown;
    score: number;
    build: () => RecommendationReason | null;
  }> = [
    {
      component: "genre",
      score: breakdown.genre,
      build: () => {
        const match = bestMatch(genreIds, profile.genreWeights, profile.genreNames);
        if (!match) return null;
        return {
          kind: "genre",
          label: `Because you love ${match.name}`,
          weight: match.weight,
        };
      },
    },
    {
      component: "actor",
      score: breakdown.actor,
      build: () => {
        const ids = details?.credits?.cast?.slice(0, 5).map((c) => c.id) ?? [];
        const match = bestMatch(ids, profile.actorWeights, profile.actorNames);
        if (!match) return null;
        return {
          kind: "actor",
          label: `Stars ${match.name}`,
          weight: match.weight,
        };
      },
    },
    {
      component: "director",
      score: breakdown.director,
      build: () => {
        const director = details?.credits?.crew?.find((c) => c.job === "Director");
        if (!director) return null;
        const weight = profile.directorWeights.get(director.id);
        if (weight == null || weight <= 0) return null;
        return {
          kind: "director",
          label: `Directed by ${director.name}`,
          weight,
        };
      },
    },
    {
      component: "keyword",
      score: breakdown.keyword,
      build: () => {
        const ids = details?.keywords?.keywords?.map((k) => k.id) ?? [];
        const match = bestMatch(ids, profile.keywordWeights, profile.keywordNames);
        if (!match) return null;
        return {
          kind: "keyword",
          label: `Matches your taste for ${match.name}`,
          weight: match.weight,
        };
      },
    },
  ];

  // Rank by component score, pick the top contributors.
  candidates.sort((a, b) => b.score - a.score);
  for (const c of candidates) {
    if (c.score <= 0) break;
    const reason = c.build();
    if (reason) reasons.push(reason);
    if (reasons.length >= 3) break;
  }

  // Hidden gem badge — purely descriptive, doesn't displace a personalization chip.
  if (reasons.length < 3 && isHiddenGem(movie)) {
    reasons.push({
      kind: "hidden_gem",
      label: "Hidden gem",
      weight: 1,
    });
  }

  // Fallback: if we still have nothing (cold start, no taste signal),
  // explain why the movie made the cut on raw popularity / acclaim.
  if (reasons.length === 0) {
    if (movie.vote_average >= 7.5 && movie.vote_count >= 500) {
      reasons.push({
        kind: "popular",
        label: "Critically acclaimed",
        weight: Math.min(1, movie.vote_average / 10),
      });
    } else if (movie.popularity > 50) {
      reasons.push({
        kind: "popular",
        label: "Trending now",
        weight: Math.min(1, movie.popularity / 200),
      });
    }
  }

  return reasons;
}
