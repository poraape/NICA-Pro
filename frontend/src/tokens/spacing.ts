/**
 * Spacing tokens provide a consistent grid derived from a 4px base unit.
 * Use `scale` for granular spacing and `semantic` for contextual rhythm.
 */

export const spacing = {
  unit: 4,
  scale: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
  },
  semantic: {
    section: 48,
    component: 24,
    element: 12,
    inline: 8,
    tight: 4,
  },
} as const;

export type SpacingScale = typeof spacing.scale;
