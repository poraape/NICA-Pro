"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import "./BottomSheet.styles.css";

export interface BottomSheetProps {
  isOpen: boolean;
  title?: string;
  ariaLabelledby?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  title,
  ariaLabelledby,
  onClose,
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const sheet = (
    <div className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby={ariaLabelledby}>
      <button className="bottom-sheet__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="bottom-sheet__content">
        <div className="bottom-sheet__header">
          {title && <h3 id={ariaLabelledby}>{title}</h3>}
          <button className="bottom-sheet__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="bottom-sheet__body">{children}</div>
      </div>
    </div>
  );

  const root = document.body;
  return createPortal(sheet, root);
};
