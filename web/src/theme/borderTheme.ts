export const BORDER_THEME_STORAGE_KEY = "recipebook_border_theme";

export type BorderThemeId =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "pink";

export const BORDER_THEME_IDS: BorderThemeId[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
];

export const BORDER_THEME_LABELS: Record<BorderThemeId, string> = {
  red: "Tomato",
  blue: "Coastal",
  green: "Garden",
  yellow: "Butter",
  purple: "Jam",
  pink: "Blush",
};

const PALETTES: Record<
  BorderThemeId,
  { accent300: string; accent500: string; accent600: string; accent700: string }
> = {
  red: {
    accent300: "#f19b74",
    accent500: "#cb5c35",
    accent600: "#ac421c",
    accent700: "#903316",
  },
  blue: {
    accent300: "#6ba8de",
    accent500: "#2f6ca5",
    accent600: "#225785",
    accent700: "#173f62",
  },
  green: {
    accent300: "#7dbb8e",
    accent500: "#3f7d53",
    accent600: "#2f6541",
    accent700: "#21492e",
  },
  yellow: {
    accent300: "#e8c86b",
    accent500: "#b8860b",
    accent600: "#936a09",
    accent700: "#694d06",
  },
  purple: {
    accent300: "#b494e3",
    accent500: "#7957c4",
    accent600: "#6043a5",
    accent700: "#472f7e",
  },
  pink: {
    accent300: "#e59bbb",
    accent500: "#c75587",
    accent600: "#aa3f70",
    accent700: "#7f2c53",
  },
};

export function readStoredBorderTheme(): BorderThemeId {
  try {
    const value = localStorage.getItem(BORDER_THEME_STORAGE_KEY);
    if (value && BORDER_THEME_IDS.includes(value as BorderThemeId)) {
      return value as BorderThemeId;
    }
  } catch {
    /* ignore */
  }
  return "red";
}

export function applyBodyBorderTheme(theme: BorderThemeId): void {
  const palette = PALETTES[theme];
  const root = document.documentElement;
  root.dataset.accent = theme;
  root.style.setProperty("--accent-300", palette.accent300);
  root.style.setProperty("--accent-500", palette.accent500);
  root.style.setProperty("--accent-600", palette.accent600);
  root.style.setProperty("--accent-700", palette.accent700);
}

export function themePreviewSurface(theme: BorderThemeId): {
  background: string;
  border: string;
} {
  const palette = PALETTES[theme];
  return {
    background: `linear-gradient(135deg, ${palette.accent300}, ${palette.accent500})`,
    border: `1px solid ${palette.accent600}`,
  };
}
