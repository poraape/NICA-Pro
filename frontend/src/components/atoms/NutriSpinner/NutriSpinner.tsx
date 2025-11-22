"use client";

import React from "react";

import "./NutriSpinner.styles.css";

export type SpinnerSize = "small" | "medium" | "large";

export interface NutriSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  ariaLabel?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  small: 16,
  medium: 24,
  large: 32,
};

export const NutriSpinner: React.FC<NutriSpinnerProps> = ({
  size = "medium",
  color,
  ariaLabel = "Carregando",
}) => (
  <span
    className={"nutri-spinner"}
    role="status"
    aria-label={ariaLabel}
    style={{ width: `${sizeMap[size]}px`, height: `${sizeMap[size]}px`, color }}
  >
    <svg viewBox="0 0 50 50" aria-hidden="true" focusable="false">
      <circle className="nutri-spinner__track" cx="25" cy="25" r="20" />
      <circle className="nutri-spinner__indicator" cx="25" cy="25" r="20" />
    </svg>
  </span>
);
