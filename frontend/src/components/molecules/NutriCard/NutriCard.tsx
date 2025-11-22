import React, { useEffect, useMemo, useState } from "react";

import { useTheme } from "@/contexts/ThemeContext";
import {
  adjustGlassOpacity,
  getRelativeLuminance,
  hexToRgb,
} from "@/utils/contrast";
import "./NutriCard.styles.css";

export type CardStatus = "neutral" | "on-track" | "near-limit" | "exceeded";
export type CardVariant = "default" | "elevated";

export interface NutriCardProps {
  status?: CardStatus;
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  backgroundImage?: string;
}

export const NutriCard: React.FC<NutriCardProps> = ({
  status = "neutral",
  variant = "default",
  children,
  className,
  onClick,
  ariaLabel,
  backgroundImage,
}) => {
  const { activeTheme } = useTheme();

  const baseLuminance = useMemo(() => {
    try {
      return getRelativeLuminance(hexToRgb(activeTheme.colors.background.elevated));
    } catch (error) {
      console.error("Unable to derive luminance from theme background", error);
      return 0.5;
    }
  }, [activeTheme.colors.background.elevated]);

  const [glassOpacity, setGlassOpacity] = useState(() => adjustGlassOpacity(baseLuminance));

  useEffect(() => {
    if (!backgroundImage) {
      setGlassOpacity(adjustGlassOpacity(baseLuminance));
      return;
    }

    if (typeof window === "undefined") return;

    let isCancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = backgroundImage;

    const handleLoad = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = 12;
      canvas.height = 12;

      try {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;

        let totalLuminance = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          totalLuminance += getRelativeLuminance({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }

        const averageLuminance = totalLuminance / pixelCount;
        const adjustedOpacity = adjustGlassOpacity(averageLuminance);

        if (!isCancelled) {
          setGlassOpacity(adjustedOpacity);
        }
      } catch (error) {
        console.warn("Falling back to theme luminance for NutriCard", error);
        setGlassOpacity(adjustGlassOpacity(baseLuminance));
      }
    };

    const handleError = () => {
      setGlassOpacity(adjustGlassOpacity(baseLuminance));
    };

    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);

    return () => {
      isCancelled = true;
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
  }, [backgroundImage, baseLuminance]);

  const classNames = [
    "nutri-card",
    `nutri-card--${variant}`,
    `nutri-card--status-${status}`,
    onClick ? "nutri-card--clickable" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cardStyle = {
    "--glass-opacity": glassOpacity.toString(),
  } as React.CSSProperties;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={classNames}
      onClick={onClick}
      aria-label={ariaLabel}
      style={cardStyle}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : "article"}
      onKeyDown={handleKeyDown}
    >
      {children}
    </article>
  );
};
