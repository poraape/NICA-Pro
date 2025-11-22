/**
 * Animation tokens define timing, easing and transitions for consistent motion.
 * Prefer semantic durations to align with accessibility and platform defaults.
 */

export const animation = {
  duration: {
    instant: 90,
    quick: 150,
    fast: 200,
    normal: 250,
    slow: 350,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    accelerated: 'cubic-bezier(0.3, 1, 0.2, 1)',
    decelerated: 'cubic-bezier(0, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  transitions: {
    emphasized: 'opacity 200ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    subtle: 'opacity 150ms cubic-bezier(0, 0, 0.2, 1)',
  },
} as const;

export type AnimationTokens = typeof animation;
