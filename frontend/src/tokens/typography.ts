/**
 * Typography tokens capture font family, sizes, weights and line heights
 * to create consistent typographic hierarchy across devices.
 */

export const typography = {
  fontFamily: {
    display: "'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
    body: "'Inter', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace",
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  semantic: {
    display: {
      fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 700,
      fontSize: 32,
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    heading: {
      fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 600,
      fontSize: 24,
      lineHeight: 1.3,
      letterSpacing: -0.25,
    },
    title: {
      fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 600,
      fontSize: 20,
      lineHeight: 1.35,
      letterSpacing: -0.15,
    },
    body: {
      fontFamily: "'Inter', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 400,
      fontSize: 16,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    bodyStrong: {
      fontFamily: "'Inter', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 600,
      fontSize: 16,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    caption: {
      fontFamily: "'Inter', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 500,
      fontSize: 14,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    micro: {
      fontFamily: "'Inter', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 500,
      fontSize: 12,
      lineHeight: 1.35,
      letterSpacing: 0.1,
    },
    mono: {
      fontFamily: "'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace",
      fontWeight: 500,
      fontSize: 14,
      lineHeight: 1.45,
      letterSpacing: 0,
    },
  },
} as const;

export type TypographyTokens = typeof typography;
