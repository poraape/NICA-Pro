import { tokens } from "../tokens";

type ThemeMode = "light" | "dark";
export type Theme = ThemeMode | "auto";

export type ThemeDefinition = {
  mode: ThemeMode;
  colors: {
    primitive: typeof tokens.color.primitive;
    background: Record<keyof typeof tokens.color.semantic.background, string>;
    surface: Record<keyof typeof tokens.color.semantic.surface, string>;
    text: Record<keyof typeof tokens.color.semantic.text, string>;
    border: Record<keyof typeof tokens.color.semantic.border, string>;
    interactive: {
      primary: Record<keyof typeof tokens.color.semantic.interactive.primary, string>;
      secondary: Record<keyof typeof tokens.color.semantic.interactive.secondary, string>;
      ghost: Record<keyof typeof tokens.color.semantic.interactive.ghost, string>;
    };
    feedback: {
      success: string;
      warning: string;
      danger: string;
      info: string;
      background: Record<keyof typeof tokens.color.semantic.feedback.background, string>;
    };
  };
  spacing: typeof tokens.spacing;
  typography: typeof tokens.typography;
  shadows: typeof tokens.shadows;
  radius: typeof tokens.radius;
  animation: typeof tokens.animation;
};

const createTheme = (mode: ThemeMode): ThemeDefinition => ({
  mode,
  colors: {
    primitive: tokens.color.primitive,
    background: {
      primary: tokens.color.semantic.background.primary[mode],
      secondary: tokens.color.semantic.background.secondary[mode],
      elevated: tokens.color.semantic.background.elevated[mode],
      muted: tokens.color.semantic.background.muted[mode],
    },
    surface: {
      solid: tokens.color.semantic.surface.solid[mode],
      translucent: tokens.color.semantic.surface.translucent[mode],
      interactive: tokens.color.semantic.surface.interactive[mode],
      inverse: tokens.color.semantic.surface.inverse[mode],
    },
    text: {
      primary: tokens.color.semantic.text.primary[mode],
      secondary: tokens.color.semantic.text.secondary[mode],
      subtle: tokens.color.semantic.text.subtle[mode],
      inverse: tokens.color.semantic.text.inverse[mode],
      interactive: tokens.color.semantic.text.interactive[mode],
    },
    border: {
      default: tokens.color.semantic.border.default[mode],
      strong: tokens.color.semantic.border.strong[mode],
      focus: tokens.color.semantic.border.focus[mode],
      muted: tokens.color.semantic.border.muted[mode],
    },
    interactive: {
      primary: {
        default: tokens.color.semantic.interactive.primary.default[mode],
        hover: tokens.color.semantic.interactive.primary.hover[mode],
        active: tokens.color.semantic.interactive.primary.active[mode],
        disabled: tokens.color.semantic.interactive.primary.disabled[mode],
      },
      secondary: {
        default: tokens.color.semantic.interactive.secondary.default[mode],
        hover: tokens.color.semantic.interactive.secondary.hover[mode],
        active: tokens.color.semantic.interactive.secondary.active[mode],
        disabled: tokens.color.semantic.interactive.secondary.disabled[mode],
      },
      ghost: {
        default: tokens.color.semantic.interactive.ghost.default[mode],
        hover: tokens.color.semantic.interactive.ghost.hover[mode],
        active: tokens.color.semantic.interactive.ghost.active[mode],
        disabled: tokens.color.semantic.interactive.ghost.disabled[mode],
      },
    },
    feedback: {
      success: tokens.color.semantic.feedback.success[mode],
      warning: tokens.color.semantic.feedback.warning[mode],
      danger: tokens.color.semantic.feedback.danger[mode],
      info: tokens.color.semantic.feedback.info[mode],
      background: {
        success: tokens.color.semantic.feedback.background.success[mode],
        warning: tokens.color.semantic.feedback.background.warning[mode],
        danger: tokens.color.semantic.feedback.background.danger[mode],
        info: tokens.color.semantic.feedback.background.info[mode],
      },
    },
  },
  spacing: tokens.spacing,
  typography: tokens.typography,
  shadows: tokens.shadows,
  radius: tokens.radius,
  animation: tokens.animation,
});

export const lightTheme = createTheme("light");
export const darkTheme = createTheme("dark");
