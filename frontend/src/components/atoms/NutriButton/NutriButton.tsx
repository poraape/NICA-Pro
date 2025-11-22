"use client";

import React from "react";

import { useTheme } from "@/contexts/ThemeContext";
import { hapticFeedback } from "@/utils/haptic";
import "./NutriButton.styles.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "small" | "medium" | "large";

type ButtonStyleVars = React.CSSProperties & {
  [key: `--${string}`]: string | number;
};

export interface NutriButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export const NutriButton: React.FC<NutriButtonProps> = ({
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  onClick,
  type = "button",
  ariaLabel,
}) => {
  const { activeTheme } = useTheme();

  const variantTokens: Record<ButtonVariant, ButtonStyleVars> = {
    primary: {
      "--nutri-button-bg": `linear-gradient(135deg, ${activeTheme.colors.interactive.primary.default}, ${activeTheme.colors.interactive.primary.hover})`,
      "--nutri-button-bg-hover": `linear-gradient(135deg, ${activeTheme.colors.interactive.primary.hover}, ${activeTheme.colors.interactive.primary.active})`,
      "--nutri-button-bg-active": activeTheme.colors.interactive.primary.active,
      "--nutri-button-border": "transparent",
      "--nutri-button-text": activeTheme.colors.text.inverse,
      "--nutri-button-text-hover": activeTheme.colors.text.inverse,
      "--nutri-button-border-disabled": activeTheme.colors.interactive.primary.disabled,
      "--nutri-button-bg-disabled": activeTheme.colors.interactive.primary.disabled,
      "--nutri-button-text-disabled": activeTheme.colors.text.subtle,
      "--nutri-button-outline": activeTheme.colors.border.focus,
      "--nutri-button-shadow": activeTheme.shadows.low,
      "--nutri-button-shadow-hover": activeTheme.shadows.medium,
      "--nutri-button-shadow-active": activeTheme.shadows.low,
      "--nutri-button-spinner-color": activeTheme.colors.text.inverse,
    },
    secondary: {
      "--nutri-button-bg": "transparent",
      "--nutri-button-bg-hover": activeTheme.colors.surface.interactive,
      "--nutri-button-bg-active": activeTheme.colors.background.muted,
      "--nutri-button-border": activeTheme.colors.interactive.secondary.default,
      "--nutri-button-text": activeTheme.colors.interactive.secondary.default,
      "--nutri-button-text-hover": activeTheme.colors.interactive.secondary.hover,
      "--nutri-button-border-disabled": activeTheme.colors.interactive.secondary.disabled,
      "--nutri-button-bg-disabled": activeTheme.colors.background.muted,
      "--nutri-button-text-disabled": activeTheme.colors.text.subtle,
      "--nutri-button-outline": activeTheme.colors.border.focus,
      "--nutri-button-shadow": activeTheme.shadows.none,
      "--nutri-button-shadow-hover": activeTheme.shadows.low,
      "--nutri-button-shadow-active": activeTheme.shadows.none,
      "--nutri-button-spinner-color": activeTheme.colors.interactive.secondary.default,
    },
    tertiary: {
      "--nutri-button-bg": "transparent",
      "--nutri-button-bg-hover": activeTheme.colors.surface.translucent,
      "--nutri-button-bg-active": activeTheme.colors.surface.interactive,
      "--nutri-button-border": "transparent",
      "--nutri-button-text": activeTheme.colors.text.interactive,
      "--nutri-button-text-hover": activeTheme.colors.text.primary,
      "--nutri-button-border-disabled": activeTheme.colors.interactive.ghost.disabled,
      "--nutri-button-bg-disabled": activeTheme.colors.background.muted,
      "--nutri-button-text-disabled": activeTheme.colors.text.subtle,
      "--nutri-button-outline": activeTheme.colors.border.focus,
      "--nutri-button-shadow": activeTheme.shadows.none,
      "--nutri-button-shadow-hover": activeTheme.shadows.low,
      "--nutri-button-shadow-active": activeTheme.shadows.none,
      "--nutri-button-spinner-color": activeTheme.colors.text.interactive,
    },
    destructive: {
      "--nutri-button-bg": `linear-gradient(135deg, ${activeTheme.colors.feedback.danger}, ${activeTheme.colors.feedback.background.danger})`,
      "--nutri-button-bg-hover": activeTheme.colors.feedback.danger,
      "--nutri-button-bg-active": activeTheme.colors.feedback.background.danger,
      "--nutri-button-border": activeTheme.colors.feedback.danger,
      "--nutri-button-text": activeTheme.colors.text.inverse,
      "--nutri-button-text-hover": activeTheme.colors.text.inverse,
      "--nutri-button-border-disabled": activeTheme.colors.interactive.primary.disabled,
      "--nutri-button-bg-disabled": activeTheme.colors.interactive.primary.disabled,
      "--nutri-button-text-disabled": activeTheme.colors.text.subtle,
      "--nutri-button-outline": activeTheme.colors.border.focus,
      "--nutri-button-shadow": activeTheme.shadows.low,
      "--nutri-button-shadow-hover": activeTheme.shadows.medium,
      "--nutri-button-shadow-active": activeTheme.shadows.low,
      "--nutri-button-spinner-color": activeTheme.colors.text.inverse,
    },
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    hapticFeedback.light();
    onClick?.(e);
  };

  const classNames = [
    "nutri-button",
    `nutri-button--${variant}`,
    `nutri-button--${size}`,
    fullWidth ? "nutri-button--full-width" : "",
    loading ? "nutri-button--loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classNames}
      style={variantTokens[variant]}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading ? (
        <span className="nutri-button__spinner" role="status" aria-label="Carregando" />
      ) : (
        <>
          {iconLeft && <span className="nutri-button__icon-left">{iconLeft}</span>}
          <span className="nutri-button__text">{children}</span>
          {iconRight && <span className="nutri-button__icon-right">{iconRight}</span>}
        </>
      )}
    </button>
  );
};
