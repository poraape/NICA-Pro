import { useEffect, useMemo } from "react";

type Modifier = "cmd" | "ctrl" | "alt" | "shift";

export interface KeyboardShortcut {
  key: string;
  callback: () => void;
  modifier?: Modifier;
  enabled?: boolean;
}

export const useKeyboardShortcut = (
  shortcuts: KeyboardShortcut | KeyboardShortcut[],
  dependencies: unknown[] = []
) => {
  const bindings = useMemo(() => (Array.isArray(shortcuts) ? shortcuts : [shortcuts]), [shortcuts]);

  useEffect(() => {
    const activeShortcuts = bindings.filter((shortcut) => shortcut.enabled ?? true);
    if (activeShortcuts.length === 0) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      activeShortcuts.forEach((shortcut) => {
        const matchesKey = event.key.toUpperCase() === shortcut.key.toUpperCase();

        let matchesModifier = true;
        if (shortcut.modifier) {
          switch (shortcut.modifier) {
            case "cmd":
              matchesModifier = event.metaKey || event.ctrlKey;
              break;
            case "ctrl":
              matchesModifier = event.ctrlKey;
              break;
            case "alt":
              matchesModifier = event.altKey;
              break;
            case "shift":
              matchesModifier = event.shiftKey;
              break;
          }
        }

        if (matchesKey && matchesModifier) {
          event.preventDefault();
          shortcut.callback();
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, bindings]);
};
