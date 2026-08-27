import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Light/dark theme (PROMPT 01 §8). Light is the default banking appearance;
 * dark is a first-class alternative, never an afterthought.
 */
const STORAGE_KEY = "rfc.theme";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    let initial: ThemeMode = "light";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") {
        initial = stored;
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initial = "dark";
      }
    } catch {
      /* storage unavailable */
    }
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
