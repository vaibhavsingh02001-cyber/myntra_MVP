import {
  SILHOUETTE_MATRIX,
  FIT_PREFERENCE_MATRIX,
  ATTRIBUTE_WEIGHTS,
} from './heuristicMatrix';
import { UserBodyProfile } from '../../../../shared/models/user.types';
import { ProductAttributes } from '../../../../shared/models/product.types';

export interface ScoreResult {
  score: number;       // 0–100
  band: 'great' | 'likely' | 'risky';
  rationale: string;
  breakdown: {
    silhouetteScore?: number;
    cutScore?: number;
    fitTypeScore?: number;
  };
}

export class ScoringEngine {
  /**
   * Computes a Fit Confidence Match Score (0–100) based on user body parameters
   * and product attributes using weighted heuristic matrix matching.
   */
  static score(profile: UserBodyProfile, attrs: ProductAttributes): ScoreResult {
    let weightedSum = 0;
    let totalWeight = 0;
    const breakdown: ScoreResult['breakdown'] = {};

    // 1. Silhouette match
    if (attrs.silhouette) {
      const compat =
        SILHOUETTE_MATRIX[profile.bodyShape]?.[attrs.silhouette.toLowerCase()] ?? 0.6;
      weightedSum += compat * ATTRIBUTE_WEIGHTS.silhouette;
      totalWeight += ATTRIBUTE_WEIGHTS.silhouette;
      breakdown.silhouetteScore = Math.round(compat * 100);
    }

    // 2. Cut match (uses silhouette matrix as approximation for cuts like wrap, a-line, flared)
    if (attrs.cut) {
      const compat =
        SILHOUETTE_MATRIX[profile.bodyShape]?.[attrs.cut.toLowerCase()] ?? 0.6;
      weightedSum += compat * ATTRIBUTE_WEIGHTS.cut;
      totalWeight += ATTRIBUTE_WEIGHTS.cut;
      breakdown.cutScore = Math.round(compat * 100);
    }

    // 3. Fit type match (slim, regular, relaxed)
    if (attrs.fitType) {
      const compat =
        FIT_PREFERENCE_MATRIX[profile.fitPreference]?.[attrs.fitType.toLowerCase()] ?? 0.6;
      weightedSum += compat * ATTRIBUTE_WEIGHTS.fitType;
      totalWeight += ATTRIBUTE_WEIGHTS.fitType;
      breakdown.fitTypeScore = Math.round(compat * 100);
    }

    // 4. Fabric & length (neutral 0.6 if present)
    weightedSum += 0.6 * ATTRIBUTE_WEIGHTS.fabric;
    totalWeight += ATTRIBUTE_WEIGHTS.fabric;

    weightedSum += 0.6 * ATTRIBUTE_WEIGHTS.length;
    totalWeight += ATTRIBUTE_WEIGHTS.length;

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    const score = Math.min(Math.max(Math.round(rawScore * 100), 0), 100);

    const band: ScoreResult['band'] =
      score >= 80 ? 'great' : score >= 60 ? 'likely' : 'risky';

    const rationale = ScoringEngine.buildRationale(profile, attrs, score, band);

    return { score, band, rationale, breakdown };
  }

  /**
   * Generates a plain-English explanation for the fit match score.
   */
  private static buildRationale(
    profile: UserBodyProfile,
    attrs: ProductAttributes,
    score: number,
    band: ScoreResult['band']
  ): string {
    const cutOrSil = attrs.cut ?? attrs.silhouette ?? 'style';

    if (band === 'great') {
      return `${capitalize(cutOrSil)} cut is a great match for ${profile.bodyShape} body shapes`;
    } else if (band === 'likely') {
      return `Likely to work for your body type — check the size guide`;
    } else {
      return `This cut may not align with your fit preference (${profile.fitPreference})`;
    }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
