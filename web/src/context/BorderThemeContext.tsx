import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import {
  BORDER_THEME_STORAGE_KEY,
  applyBodyBorderTheme,
  readStoredBorderTheme,
  type BorderThemeId,
} from "../theme/borderTheme";

interface BorderThemeContextValue {
  borderTheme: BorderThemeId;
  setBorderTheme: (id: BorderThemeId) => void;
}

const BorderThemeContext = createContext<BorderThemeContextValue | undefined>(undefined);

export function BorderThemeProvider({ children }: { children: ReactNode }) {
  const [borderTheme, setBorderThemeState] = useState<BorderThemeId>(() =>
    readStoredBorderTheme(),
  );

  const setBorderTheme = useCallback((id: BorderThemeId) => {
    setBorderThemeState(id);
    try {
      localStorage.setItem(BORDER_THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  useLayoutEffect(() => {
    applyBodyBorderTheme(borderTheme);
  }, [borderTheme]);

  return (
    <BorderThemeContext.Provider value={{ borderTheme, setBorderTheme }}>
      {children}
    </BorderThemeContext.Provider>
  );
}

export function useBorderTheme(): BorderThemeContextValue {
  const ctx = useContext(BorderThemeContext);
  if (!ctx) throw new Error("useBorderTheme must be used within BorderThemeProvider");
  return ctx;
}
