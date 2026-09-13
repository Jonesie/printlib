import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "slate", name: "Slate" },
  { id: "forest", name: "Forest" },
  { id: "sunset", name: "Sunset" },
  { id: "midnight", name: "Midnight" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "printlib-theme";

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall back silently
  }
  return "slate";
}

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore — theme still applies for this page load, just won't persist
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
