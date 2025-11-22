import React from "react";
import "./Tooltip.styles.css";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "right" | "bottom" | "left";
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = "top" }) => {
  return (
    <span className={`tooltip tooltip--${position}`} role="presentation">
      {children}
      <span role="tooltip" className="tooltip__bubble">
        {content}
      </span>
    </span>
  );
};

export default Tooltip;
