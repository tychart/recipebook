/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES,
  type IngredientAmountDensity,
  type IngredientAmountDisplayPreferences,
  type IngredientAmountStyle,
} from "../lib/ingredientAmountDisplay";

const INGREDIENT_AMOUNT_DISPLAY_STORAGE_KEY = "recipebook_ingredient_amount_display";

type IngredientAmountDisplayContextValue = {
  preferences: IngredientAmountDisplayPreferences;
  setEnabled: (enabled: boolean) => void;
  setStyle: (style: IngredientAmountStyle) => void;
  setDisplayDensity: (density: IngredientAmountDensity) => void;
  resetPreferences: () => void;
};

const IngredientAmountDisplayContext = createContext<
  IngredientAmountDisplayContextValue | undefined
>(undefined);

function readStoredPreferences(): IngredientAmountDisplayPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(INGREDIENT_AMOUNT_DISPLAY_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<IngredientAmountDisplayPreferences>;
    return {
      enabled:
        typeof parsed.enabled === "boolean"
          ? parsed.enabled
          : DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES.enabled,
      style:
        parsed.style === "ascii" || parsed.style === "unicode"
          ? parsed.style
          : DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES.style,
      displayDensity:
        parsed.displayDensity === "compact" ||
        parsed.displayDensity === "normal" ||
        parsed.displayDensity === "large"
          ? parsed.displayDensity
          : DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES.displayDensity,
      fallbackMode: "decimal",
    };
  } catch {
    return DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES;
  }
}

function persistPreferences(preferences: IngredientAmountDisplayPreferences) {
  try {
    window.localStorage.setItem(
      INGREDIENT_AMOUNT_DISPLAY_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    /* ignore */
  }
}

export function IngredientAmountDisplayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<IngredientAmountDisplayPreferences>(() =>
    readStoredPreferences(),
  );

  const updatePreferences = useCallback(
    (nextPreferences: IngredientAmountDisplayPreferences) => {
      setPreferences(nextPreferences);
      persistPreferences(nextPreferences);
    },
    [],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      updatePreferences({
        ...preferences,
        enabled,
      });
    },
    [preferences, updatePreferences],
  );

  const setStyle = useCallback(
    (style: IngredientAmountStyle) => {
      updatePreferences({
        ...preferences,
        style,
      });
    },
    [preferences, updatePreferences],
  );

  const setDisplayDensity = useCallback(
    (displayDensity: IngredientAmountDensity) => {
      updatePreferences({
        ...preferences,
        displayDensity,
      });
    },
    [preferences, updatePreferences],
  );

  const resetPreferences = useCallback(() => {
    updatePreferences(DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES);
  }, [updatePreferences]);

  const value = useMemo(
    () => ({
      preferences,
      setEnabled,
      setStyle,
      setDisplayDensity,
      resetPreferences,
    }),
    [preferences, resetPreferences, setDisplayDensity, setEnabled, setStyle],
  );

  return (
    <IngredientAmountDisplayContext.Provider value={value}>
      {children}
    </IngredientAmountDisplayContext.Provider>
  );
}

export function useIngredientAmountDisplay() {
  const context = useContext(IngredientAmountDisplayContext);
  if (!context) {
    throw new Error(
      "useIngredientAmountDisplay must be used within IngredientAmountDisplayProvider",
    );
  }
  return context;
}
