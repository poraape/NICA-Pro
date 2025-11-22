"use client";

import React, { useMemo, useRef, useState } from "react";

import { NutriIcon } from "@/components/atoms";
import { hapticFeedback } from "@/utils/haptic";

import "./FoodItem.styles.css";

export interface FoodItemProps {
  name: string;
  portion: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  thumbnailUrl?: string;
  onEdit?: () => void;
  onRemove?: () => void;
  onComplete?: () => void;
  onLongPress?: () => void;
  ariaLabel?: string;
}

const ACTIVATION_DISTANCE = 40;
const COMMIT_RATIO = 0.6;

export const FoodItem: React.FC<FoodItemProps> = ({
  name,
  portion,
  calories,
  protein,
  carbs,
  fat,
  thumbnailUrl,
  onEdit,
  onRemove,
  onComplete,
  onLongPress,
  ariaLabel,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const longPressTimeout = useRef<number | null>(null);

  const macros = useMemo(() => {
    const parts = [
      protein !== undefined ? `${protein}g P` : null,
      carbs !== undefined ? `${carbs}g C` : null,
      fat !== undefined ? `${fat}g G` : null,
    ].filter(Boolean);

    return parts.join(" · ");
  }, [protein, carbs, fat]);

  const resolvedLabel =
    ariaLabel ??
    `${name}, porção ${portion}${calories ? `, ${calories} kcal` : ""}${macros ? `, macros ${macros}` : ""}`;

  const clearGesture = () => {
    setDragOffset(0);
    startX.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);

    longPressTimeout.current = window.setTimeout(() => {
      onLongPress?.();
      hapticFeedback.medium();
    }, 500);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const delta = event.clientX - startX.current;
    setDragOffset(delta);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    if (startX.current === null) return;
    const delta = event.clientX - startX.current;
    const width = cardRef.current?.offsetWidth ?? 1;
    const ratio = Math.abs(delta) / width;

    if (Math.abs(delta) >= ACTIVATION_DISTANCE && ratio >= COMMIT_RATIO) {
      if (delta > 0) {
        onComplete?.();
        hapticFeedback.medium();
      } else {
        if (onEdit) {
          onEdit();
        } else {
          onRemove?.();
        }
        hapticFeedback.medium();
      }
    }

    clearGesture();
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handlePointerCancel = () => {
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    clearGesture();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onComplete?.();
      hapticFeedback.medium();
    }

    if (event.key.toLowerCase() === "e") {
      onEdit?.();
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      onRemove?.();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`food-item${dragOffset !== 0 ? " food-item--dragging" : ""}`}
      role="article"
      aria-label={resolvedLabel}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      style={{ transform: `translateX(${dragOffset}px)` }}
    >
      <div className="food-item__visual" aria-hidden>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" />
        ) : (
          <div className="food-item__placeholder">{name.charAt(0).toUpperCase()}</div>
        )}
      </div>
      <div className="food-item__content">
        <div className="food-item__header">
          <div className="food-item__titles">
            <span className="food-item__name">{name}</span>
            <span className="food-item__portion">{portion}</span>
          </div>
          <div className="food-item__actions" aria-hidden>
            {onEdit && (
              <button type="button" onClick={onEdit} className="food-item__icon-btn">
                <NutriIcon name="edit" ariaHidden size="small" />
              </button>
            )}
            {onRemove && (
              <button type="button" onClick={onRemove} className="food-item__icon-btn food-item__icon-btn--danger">
                <NutriIcon name="delete" ariaHidden size="small" />
              </button>
            )}
            {onComplete && (
              <button type="button" onClick={onComplete} className="food-item__icon-btn food-item__icon-btn--success">
                <NutriIcon name="check_circle" ariaHidden size="small" />
              </button>
            )}
          </div>
        </div>
        <div className="food-item__meta">
          {calories !== undefined && <span className="food-item__calories">{calories} kcal</span>}
          {macros && <span className="food-item__macros">{macros}</span>}
        </div>
      </div>
    </div>
  );
};
