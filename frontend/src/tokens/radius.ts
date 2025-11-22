/**
 * Radius tokens enforce consistent curvature across components
 * and support pill/circular affordances for interactive elements.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
  full: 9999,
} as const;

export type RadiusTokens = typeof radius;
