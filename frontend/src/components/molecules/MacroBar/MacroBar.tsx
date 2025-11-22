"use client";

import React, { useMemo } from "react";

import { NutriIcon } from "@/components/atoms";

import "./MacroBar.styles.css";

export type MacroBarSize = "small" | "medium" | "large";

export interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: MacroBarSize;
  goal?: number;
  showTextures?: boolean;
  ariaLabel?: string;
  unit?: string;
}

const sizeMap: Record<MacroBarSize, number> = {
  small: 24,
  medium: 32,
  large: 48,
};

type MacroSegment = {
  key: "protein" | "carbs" | "fat";
  value: number;
  color: string;
};

export const MacroBar: React.FC<MacroBarProps> = ({
  protein,
  carbs,
  fat,
  size = "medium",
  goal,
  showTextures = false,
  ariaLabel,
  unit = "g",
}) => {
  const segments: MacroSegment[] = useMemo(
    () => [
      { key: "protein", value: protein, color: "var(--color-interactive-primary-default)" },
      { key: "carbs", value: carbs, color: "var(--color-interactive-secondary-default, var(--color-feedback-info))" },
      { key: "fat", value: fat, color: "var(--color-feedback-warning)" },
    ],
    [protein, carbs, fat]
  );

  const total = useMemo(() => segments.reduce((acc, segment) => acc + Math.max(segment.value, 0), 0), [segments]);
  const safeTotal = total || 1;

  const goalPosition = goal ? Math.min(100, Math.max(0, (goal / safeTotal) * 100)) : undefined;

  const resolvedLabel =
    ariaLabel ??
    `Distribuição de macros: proteína ${protein}${unit}, carboidratos ${carbs}${unit}, gorduras ${fat}${unit}` +
      (goal ? `, meta ${goal}${unit}` : "");

  return (
    <div
      className={`macro-bar macro-bar--${size}`}
      role="img"
      aria-label={resolvedLabel}
      style={{ height: `${sizeMap[size]}px` }}
    >
      <div className="macro-bar__track">
        {segments.map((segment) => {
          const percentage = (Math.max(segment.value, 0) / safeTotal) * 100;
          const showLabel = percentage >= 15;

          return (
            <div
              key={segment.key}
              className={`macro-bar__segment macro-bar__segment--${segment.key} ${
                showTextures ? "macro-bar__segment--textured" : ""
              }`}
              style={{ width: `${percentage}%`, backgroundColor: segment.color }}
            >
              {showLabel && (
                <span className="macro-bar__label">
                  {segment.key === "carbs" ? "Carb" : segment.key.charAt(0).toUpperCase() + segment.key.slice(1)}
                  {` ${Math.round(segment.value)}${unit}`}
                </span>
              )}
            </div>
          );
        })}
        {goalPosition !== undefined && (
          <div className="macro-bar__goal" style={{ left: `${goalPosition}%` }} aria-hidden>
            <span className="macro-bar__goal-icon">
              <NutriIcon name="flag" size="small" ariaHidden />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
