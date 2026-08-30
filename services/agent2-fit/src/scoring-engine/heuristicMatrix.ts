/**
 * Heuristic Scoring Matrix for Fit Confidence Scoring.
 * Maps body shape & fit preference to product cuts, silhouettes, and fit types.
 */

// Compatibility matrix: body_shape → silhouette/cut → score (0.0–1.0)
export const SILHOUETTE_MATRIX: Record<string, Record<string, number>> = {
  pear: {
    'a-line':    1.0,
    'flared':    0.9,
    'wrap':      0.9,
    'relaxed':   0.7,
    'straight':  0.6,
    'fitted':    0.4,
    'oversized': 0.6,
    'bodycon':   0.2,
  },
  apple: {
    'wrap':      1.0,
    'relaxed':   0.9,
    'a-line':    0.8,
    'straight':  0.7,
    'oversized': 0.7,
    'flared':    0.6,
    'fitted':    0.3,
    'bodycon':   0.2,
  },
  hourglass: {
    'wrap':      1.0,
    'fitted':    0.9,
    'bodycon':   0.8,
    'a-line':    0.8,
    'straight':  0.7,
    'flared':    0.7,
    'relaxed':   0.6,
    'oversized': 0.5,
  },
  rectangle: {
    'flared':    0.9,
    'a-line':    0.8,
    'wrap':      0.8,
    'fitted':    0.7,
    'bodycon':   0.7,
    'straight':  0.6,
    'relaxed':   0.6,
    'oversized': 0.5,
  },
  inverted_triangle: {
    'flared':    1.0,
    'a-line':    0.9,
    'straight':  0.8,
    'wrap':      0.7,
    'relaxed':   0.7,
    'fitted':    0.5,
    'oversized': 0.5,
    'bodycon':   0.4,
  },
};

// Fit preference matrix: user fit preference vs product fit_type
export const FIT_PREFERENCE_MATRIX: Record<string, Record<string, number>> = {
  slim:    { slim: 1.0, regular: 0.6, plus: 0.2, petite: 0.8 },
  regular: { slim: 0.7, regular: 1.0, plus: 0.5, petite: 0.7 },
  relaxed: { slim: 0.3, regular: 0.7, plus: 0.8, petite: 0.6 },
};

// Weights for computing the final weighted average score
export const ATTRIBUTE_WEIGHTS = {
  silhouette: 0.35,
  cut:        0.30,
  fitType:    0.20,
  fabric:     0.10,
  length:     0.05,
};
