"use client";

import React, { useId, useMemo } from "react";

import "./NutriProgressRing.styles.css";

export type ProgressRingSize = "small" | "medium" | "large";

export interface NutriProgressRingProps {
  value: number;
  size?: ProgressRingSize;
  unit?: string;
  label?: string;
  ariaLabel?: string;
}

const sizeMap: Record<ProgressRingSize, number> = {
  small: 48,
  medium: 80,
  large: 120,
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const NutriProgressRing: React.FC<NutriProgressRingProps> = ({
  value,
  size = "medium",
  unit = "%",
  label = "progresso",
  ariaLabel,
}) => {
  const gradientId = useId();
  const normalized = useMemo(() => Math.min(100, Math.max(0, value)), [value]);
  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE * (1 - normalized / 100),
    [normalized]
  );

  const resolvedAriaLabel =
    ariaLabel ?? `Progresso de ${label}: ${normalized}%${unit === "%" ? "" : ` ${unit}`} da meta`;

  return (
    <div
      className="nutri-progress-ring"
      role="img"
      aria-label={resolvedAriaLabel}
      style={{ width: `${sizeMap[size]}px`, height: `${sizeMap[size]}px` }}
    >
      <svg
        className="nutri-progress-ring__svg"
        viewBox="0 0 120 120"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-interactive-primary-default)" />
            <stop offset="100%" stopColor="var(--color-interactive-secondary-default, var(--color-interactive-primary-hover))" />
          </linearGradient>
        </defs>
        <circle
          className="nutri-progress-ring__track"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeWidth="10"
        />
        <circle
          className="nutri-progress-ring__indicator"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeWidth="10"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          stroke={`url(#${gradientId})`}
        />
      </svg>
      <div className="nutri-progress-ring__label" aria-live="polite">
        <span className="nutri-progress-ring__value">{normalized}</span>
        <span className="nutri-progress-ring__unit">{unit}</span>
      </div>
    </div>
  );
};
