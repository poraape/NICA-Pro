import { animation } from './animation';
import { modes, primitiveColors, semanticColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export * from './animation';
export * from './colors';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';

// Consolidated token object for convenient imports.
export const tokens = {
  color: {
    primitive: primitiveColors,
    semantic: semanticColors,
    modes,
  },
  spacing,
  typography,
  shadows,
  radius,
  animation,
} as const;

export type Tokens = typeof tokens;
