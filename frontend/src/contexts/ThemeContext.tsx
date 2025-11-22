"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { applyTheme } from "@/styles/applyTheme";
import { darkTheme, lightTheme, type Theme, type ThemeDefinition } from "@/styles/theme";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeTheme: ThemeDefinition;
}

const THEME_STORAGE_KEY = "nica-pro:theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const resolvePreferredTheme = (value: Theme) => {
  if (typeof window === "undefined") return lightTheme;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = value === "dark" || (value === "auto" && mediaQuery.matches);
  return isDark ? darkTheme : lightTheme;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "auto";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
  });
  const [activeTheme, setActiveTheme] = useState<ThemeDefinition>(lightTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyResolvedTheme = (mode: Theme) => {
      const resolved = resolvePreferredTheme(mode);
      setActiveTheme(resolved);
      applyTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved.mode === "dark");
    };

    applyResolvedTheme(theme);

    const handleChange = () => {
      if (theme === "auto") {
        applyResolvedTheme("auto");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
