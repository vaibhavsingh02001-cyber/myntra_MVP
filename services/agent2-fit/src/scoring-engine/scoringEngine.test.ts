import { ScoringEngine } from './scoringEngine';
import { UserBodyProfile } from '../../../../shared/models/user.types';
import { ProductAttributes } from '../../../../shared/models/product.types';

describe('ScoringEngine', () => {
  const pearProfile: UserBodyProfile = {
    heightRange: "5'2\"-5'5\"",
    bodyShape: 'pear',
    fitPreference: 'regular',
    comfortPriority: 'drape',
    updatedAt: new Date(),
  };

  const hourglassProfile: UserBodyProfile = {
    heightRange: "5'5\"-5'8\"",
    bodyShape: 'hourglass',
    fitPreference: 'slim',
    comfortPriority: 'structure',
    updatedAt: new Date(),
  };

  it('scores pear body shape + A-line dress high (great band, ≥80%)', () => {
    const attrs: ProductAttributes = {
      cut: 'wrap',
      silhouette: 'a-line',
      fitType: 'regular',
      fabric: 'chiffon',
      source: 'structured',
      isComplete: () => true,
    };

    const result = ScoringEngine.score(pearProfile, attrs);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.band).toBe('great');
    expect(result.rationale).toContain('pear body shapes');
  });

  it('scores pear body shape + bodycon dress low (risky band, <60%)', () => {
    const attrs: ProductAttributes = {
      silhouette: 'bodycon',
      fitType: 'slim',
      source: 'structured',
      isComplete: () => true,
    };

    const result = ScoringEngine.score(pearProfile, attrs);
    expect(result.score).toBeLessThan(60);
    expect(result.band).toBe('risky');
  });

  it('scores hourglass + wrap dress in great band', () => {
    const attrs: ProductAttributes = {
      cut: 'wrap',
      silhouette: 'fitted',
      fitType: 'slim',
      source: 'structured',
      isComplete: () => true,
    };

    const result = ScoringEngine.score(hourglassProfile, attrs);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.band).toBe('great');
  });
});
