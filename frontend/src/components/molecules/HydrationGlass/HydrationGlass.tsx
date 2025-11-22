import React from "react";

import "./HydrationGlass.styles.css";

export type HydrationGlassSize = "small" | "medium" | "large";

export interface HydrationGlassProps {
  current: number;
  target: number;
  unit?: string;
  size?: HydrationGlassSize;
  ariaLabel?: string;
}

export const HydrationGlass: React.FC<HydrationGlassProps> = ({
  current,
  target,
  unit = "L",
  size = "medium",
  ariaLabel,
}) => {
  const safeTarget = Math.max(target, 0);
  const ratio = safeTarget === 0 ? 0 : Math.min(current / safeTarget, 1.2);
  const fillPercent = Math.max(0, Math.min(ratio * 100, 120));

  const label =
    ariaLabel ?? `Progresso de hidratação: ${current}${unit} de ${target}${unit}`;

  return (
    <div
      className={`hydration-glass hydration-glass--${size}`}
      role="img"
      aria-label={label}
      style={{ "--hydration-fill": `${fillPercent}%` } as React.CSSProperties}
    >
      <div className="hydration-glass__vessel">
        <div className="hydration-glass__liquid" />
        <div className="hydration-glass__bubble" aria-hidden />
      </div>
      <div className="hydration-glass__label" aria-hidden>
        <span className="hydration-glass__value">{current}</span>
        <span className="hydration-glass__unit">{unit}</span>
      </div>
    </div>
  );
};
