import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "moviemark-theme";

function getInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    console.error("Error reading theme from localStorage");
  }
  return "system";
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  document.documentElement.className =
    mode === "dark" || (mode === "system") ? "dark" : "";
  if (mode !== "system") return mode;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeToColorScheme(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getColorSchemeSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const prefersDark = useSyncExternalStore(
    subscribeToColorScheme,
    getColorSchemeSnapshot,
    () => false
  );
  const resolvedMode = useMemo<"light" | "dark">(
    () => (mode === "system" ? (prefersDark ? "dark" : "light") : resolveMode(mode)),
    [mode, prefersDark]
  );

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    document.documentElement.className = newMode === "dark" || (newMode === "system" && prefersDark) ? "dark" : "";
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      console.error("Error saving theme to localStorage");
    }
  }, []);

  const value = useMemo(
    () => ({ mode, resolvedMode, setMode }),
    [mode, resolvedMode, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
}
