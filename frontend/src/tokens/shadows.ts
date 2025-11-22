/**
 * Shadow tokens capture depth and atmospheric layers for glassmorphism
 * while remaining WCAG-friendly for contrasting surfaces.
 */

export const shadows = {
  none: 'none',
  low: '0 4px 12px rgba(15, 23, 42, 0.08)',
  medium: '0 10px 30px rgba(15, 23, 42, 0.12)',
  high: '0 24px 60px rgba(15, 23, 42, 0.18)',
  glow: '0 0 1px rgba(255, 255, 255, 0.3), 0 20px 40px rgba(52, 211, 153, 0.35)',
} as const;

export type ShadowTokens = typeof shadows;
