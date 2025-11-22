/**
 * Primitive and semantic color tokens for the design system.
 * Primitives map directly to palette values; semantic tokens derive from primitives
 * to ensure consistent usage across light and dark modes.
 */

type ThemeMode = 'light' | 'dark';

export type ThemedColor = {
  light: string;
  dark: string;
};

// Primitive palette values organized by hue and intensity.
export const primitiveColors = {
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    500: '#4CAF50',
    700: '#388E3C',
    900: '#1B5E20',
  },
  secondary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    500: '#2196F3',
    700: '#1976D2',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    400: '#BDBDBD',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#121212',
  },
  success: {
    50: '#E6F4EA',
    100: '#C8E6C9',
    500: '#2E7D32',
    700: '#1B5E20',
    900: '#0F3B12',
  },
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    500: '#FFB300',
    700: '#FF8F00',
    900: '#E65100',
  },
  danger: {
    50: '#FDECEA',
    100: '#FACDCD',
    500: '#E53935',
    700: '#B71C1C',
    900: '#7F0000',
  },
  info: {
    50: '#E8F1FD',
    100: '#D2E3FC',
    500: '#1E88E5',
    700: '#1565C0',
    900: '#0D3A66',
  },
  overlay: {
    glass: 'rgba(255, 255, 255, 0.28)',
    glassStrong: 'rgba(255, 255, 255, 0.44)',
    scrim: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

// Semantic tokens derived from primitive palette values.
export const semanticColors = {
  background: {
    primary: { light: primitiveColors.neutral[50], dark: primitiveColors.neutral[1000] },
    secondary: { light: primitiveColors.neutral[100], dark: primitiveColors.neutral[900] },
    elevated: { light: primitiveColors.neutral[0], dark: primitiveColors.neutral[800] },
    muted: { light: primitiveColors.neutral[200], dark: primitiveColors.neutral[800] },
  },
  surface: {
    solid: { light: primitiveColors.neutral[0], dark: primitiveColors.neutral[900] },
    translucent: { light: primitiveColors.overlay.glass, dark: primitiveColors.overlay.glassStrong },
    interactive: { light: primitiveColors.primary[50], dark: primitiveColors.primary[900] },
    inverse: { light: primitiveColors.neutral[900], dark: primitiveColors.neutral[0] },
  },
  text: {
    primary: { light: primitiveColors.neutral[900], dark: primitiveColors.neutral[50] },
    secondary: { light: primitiveColors.neutral[700], dark: primitiveColors.neutral[200] },
    subtle: { light: primitiveColors.neutral[600], dark: primitiveColors.neutral[400] },
    inverse: { light: primitiveColors.neutral[0], dark: primitiveColors.neutral[900] },
    interactive: { light: primitiveColors.primary[700], dark: primitiveColors.primary[100] },
  },
  border: {
    default: { light: primitiveColors.neutral[200], dark: primitiveColors.neutral[800] },
    strong: { light: primitiveColors.neutral[400], dark: primitiveColors.neutral[700] },
    focus: { light: primitiveColors.primary[500], dark: primitiveColors.primary[200] },
    muted: { light: primitiveColors.neutral[100], dark: primitiveColors.neutral[900] },
  },
  interactive: {
    primary: {
      default: { light: primitiveColors.primary[500], dark: primitiveColors.primary[200] },
      hover: { light: primitiveColors.primary[700], dark: primitiveColors.primary[100] },
      active: { light: primitiveColors.primary[900], dark: primitiveColors.primary[50] },
      disabled: { light: primitiveColors.neutral[200], dark: primitiveColors.neutral[800] },
    },
    secondary: {
      default: { light: primitiveColors.secondary[500], dark: primitiveColors.secondary[100] },
      hover: { light: primitiveColors.secondary[700], dark: primitiveColors.secondary[50] },
      active: { light: primitiveColors.secondary[700], dark: primitiveColors.secondary[100] },
      disabled: { light: primitiveColors.neutral[200], dark: primitiveColors.neutral[800] },
    },
    ghost: {
      default: { light: primitiveColors.neutral[900], dark: primitiveColors.neutral[50] },
      hover: { light: primitiveColors.neutral[700], dark: primitiveColors.neutral[200] },
      active: { light: primitiveColors.neutral[600], dark: primitiveColors.neutral[200] },
      disabled: { light: primitiveColors.neutral[300], dark: primitiveColors.neutral[700] },
    },
  },
  feedback: {
    success: { light: primitiveColors.success[500], dark: primitiveColors.success[100] },
    warning: { light: primitiveColors.warning[500], dark: primitiveColors.warning[100] },
    danger: { light: primitiveColors.danger[500], dark: primitiveColors.danger[100] },
    info: { light: primitiveColors.info[500], dark: primitiveColors.info[100] },
    background: {
      success: { light: primitiveColors.success[50], dark: primitiveColors.success[900] },
      warning: { light: primitiveColors.warning[50], dark: primitiveColors.warning[900] },
      danger: { light: primitiveColors.danger[50], dark: primitiveColors.danger[900] },
      info: { light: primitiveColors.info[50], dark: primitiveColors.info[900] },
    },
  },
} satisfies Record<string, unknown>;

export type ThemeTokenGroup = typeof semanticColors;

export const modes: ThemeMode[] = ['light', 'dark'];
