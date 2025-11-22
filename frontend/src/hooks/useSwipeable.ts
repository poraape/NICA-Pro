import React, { useRef } from "react";

interface SwipeableOptions {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
  onSwipedUp?: () => void;
  onSwipedDown?: () => void;
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean;
  threshold?: number;
}

/**
 * Lightweight swipe detection hook for touch interactions.
 * Defaults to a 40px threshold and ignores mouse tracking unless enabled.
 */
export const useSwipeable = (options: SwipeableOptions) => {
  const {
    onSwipedLeft,
    onSwipedRight,
    onSwipedUp,
    onSwipedDown,
    preventDefaultTouchmoveEvent = true,
    trackMouse = false,
    threshold = 40,
  } = options;

  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!("touches" in e)) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!("touches" in e)) return;
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if ("changedTouches" in e) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX.current;
      const deltaY = endY - startY.current;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipedRight?.();
        } else {
          onSwipedLeft?.();
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipedDown?.();
        } else {
          onSwipedUp?.();
        }
      }
    }
  };

  const handlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } as const;

  if (trackMouse) {
    return {
      ...handlers,
      onMouseDown: onTouchStart,
      onMouseUp: onTouchEnd,
    } as const;
  }

  return handlers;
};
