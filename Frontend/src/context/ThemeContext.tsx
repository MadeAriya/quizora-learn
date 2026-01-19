"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import useThemeDetector from "../hooks/useThemeDetector";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemPrefersDark = useThemeDetector();
  const [manualTheme, setManualTheme] = useState<Theme | null>(null); 
  const theme: Theme = manualTheme ?? (systemPrefersDark ? "dark" : "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setManualTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) setManualTheme(saved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
