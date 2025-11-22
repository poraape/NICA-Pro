import React from "react";

import { NutriIcon } from "@/components/atoms/NutriIcon";

import "./MealChecklist.styles.css";

export interface MealChecklistProps {
  completed: number;
  total: number;
  ariaLabel?: string;
}

export const MealChecklist: React.FC<MealChecklistProps> = ({ completed, total, ariaLabel }) => {
  const safeTotal = Math.max(total, 0);
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal);
  const items = Array.from({ length: safeTotal }, (_, index) => index < safeCompleted);
  const label =
    ariaLabel ?? `Refeições concluídas: ${safeCompleted} de ${safeTotal}${safeTotal === 1 ? " refeição" : " refeições"}`;

  return (
    <div className="meal-checklist" role="img" aria-label={label}>
      {items.map((isDone, index) => (
        <div
          key={`meal-${index}`}
          className={`meal-checklist__item ${isDone ? "meal-checklist__item--done" : ""}`}
          aria-hidden
        >
          {isDone ? (
            <NutriIcon name="check.circle.fill" size="small" aria-hidden />
          ) : (
            <span className="meal-checklist__dot" />
          )}
        </div>
      ))}
      {safeTotal === 0 && <span className="meal-checklist__empty">Nenhuma refeição registrada</span>}
    </div>
  );
};
