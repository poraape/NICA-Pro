"use client";

import React from "react";

import "./NutriIcon.styles.css";

export type IconSize = "small" | "medium" | "large" | "xl";
export type IconWeight = "ultralight" | "thin" | "light" | "regular" | "medium" | "semibold" | "bold";
export type IconTone = "monochrome" | "hierarchical" | "multicolor";

export interface NutriIconProps {
  name: string;
  size?: IconSize;
  weight?: IconWeight;
  tone?: IconTone;
  className?: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
}

const sizeMap: Record<IconSize, number> = {
  small: 16,
  medium: 24,
  large: 32,
  xl: 48,
};

const weightMap: Record<IconWeight, number> = {
  ultralight: 200,
  thin: 250,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const NutriIcon: React.FC<NutriIconProps> = ({
  name,
  size = "medium",
  weight = "regular",
  tone = "monochrome",
  className = "",
  ariaLabel,
  ariaHidden,
}) => {
  const resolvedAriaHidden = ariaHidden ?? !ariaLabel;
  const classes = ["nutri-icon", `nutri-icon--${size}`, `nutri-icon--${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{
        fontSize: `${sizeMap[size]}px`,
        fontVariationSettings: `"FILL" 0, "wght" ${weightMap[weight]}, "GRAD" 0, "opsz" ${sizeMap[size]}`,
      }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={resolvedAriaHidden}
    >
      {name}
    </span>
  );
};
