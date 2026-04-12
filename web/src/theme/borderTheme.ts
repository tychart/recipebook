export const BORDER_THEME_STORAGE_KEY = "recipebook_border_theme";

export type BorderThemeId = "red" | "blue" | "green" | "yellow" | "purple" | "pink";

export const BORDER_THEME_IDS: BorderThemeId[] = ["red", "blue", "green", "yellow", "purple", "pink"];

export const BORDER_THEME_LABELS: Record<BorderThemeId, string> = {
  red: "Red",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
  purple: "Purple",
  pink: "Pink",
};

const PALETTES: Record<BorderThemeId, { dark: string; light: string }> = {
  red: { dark: "#d21404", light: "#fc6b5f" },
  blue: { dark: "#1d4ed8", light: "#7dd3fc" },
  green: { dark: "#15803d", light: "#4ade80" },
  yellow: { dark: "#facc15", light: "#fef9c3" },
  purple: { dark: "#7e22ce", light: "#d8b4fe" },
  pink: { dark: "#be185d", light: "#fbcfe8" },
};

/** Bold rule under recipe title on index-style cards — matches page border theme. */
export const recipeCardAccentLineHex: Record<BorderThemeId, string> = {
  red: PALETTES.red.dark,
  blue: PALETTES.blue.dark,
  green: PALETTES.green.dark,
  yellow: PALETTES.yellow.dark,
  purple: PALETTES.purple.dark,
  pink: PALETTES.pink.dark,
};

const PAGE_FILL = "#EEE9E0";
const WHITE = "#ffffff";

/** 3×3 gingham cell grid; `cellSize` is one square (e.g. 15 for 45px tile, 10 for 30px). */
function makeGinghamSvg(cellSize: number, dark: string, light: string, white: string): string {
  const s = cellSize;
  const t = cellSize * 3;
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${t}' height='${t}'>` +
    `<rect x='0' y='0' width='${s}' height='${s}' fill='${dark}'/>` +
    `<rect x='${s}' y='0' width='${s}' height='${s}' fill='${light}'/>` +
    `<rect x='${s * 2}' y='0' width='${s}' height='${s}' fill='${white}'/>` +
    `<rect x='0' y='${s}' width='${s}' height='${s}' fill='${light}'/>` +
    `<rect x='${s}' y='${s}' width='${s}' height='${s}' fill='${white}'/>` +
    `<rect x='${s * 2}' y='${s}' width='${s}' height='${s}' fill='${dark}'/>` +
    `<rect x='0' y='${s * 2}' width='${s}' height='${s}' fill='${white}'/>` +
    `<rect x='${s}' y='${s * 2}' width='${s}' height='${s}' fill='${dark}'/>` +
    `<rect x='${s * 2}' y='${s * 2}' width='${s}' height='${s}' fill='${light}'/>` +
    `</svg>`
  );
}

function ginghamDataUrl(cellSize: number, theme: BorderThemeId): string {
  const { dark, light } = PALETTES[theme];
  const svg = makeGinghamSvg(cellSize, dark, light, WHITE);
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Full `backgroundImage` for sidebar: beige fill + gingham border strip. */
export function sidebarBackgroundImage(theme: BorderThemeId): string {
  return `linear-gradient(${PAGE_FILL}, ${PAGE_FILL}), ${ginghamDataUrl(10, theme)}`;
}

export function readStoredBorderTheme(): BorderThemeId {
  try {
    const v = localStorage.getItem(BORDER_THEME_STORAGE_KEY);
    if (v && BORDER_THEME_IDS.includes(v as BorderThemeId)) return v as BorderThemeId;
  } catch {
    /* ignore */
  }
  return "red";
}

/** Apply page border (body) — matches previous index.css behavior. */
export function applyBodyBorderTheme(theme: BorderThemeId): void {
  document.body.style.backgroundColor = PAGE_FILL;
  document.body.style.backgroundImage = ginghamDataUrl(15, theme);
  document.body.style.backgroundSize = "45px 45px";
  document.body.style.backgroundAttachment = "fixed";
}

/** Sidebar nav “active” + app title link — Tailwind class strings. */
export const sidebarActiveNavClasses: Record<BorderThemeId, string> = {
  red: "bg-red-500 text-white border-red-500 hover:bg-red-600",
  blue: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
  green: "bg-green-600 text-white border-green-600 hover:bg-green-700",
  yellow: "bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700",
  purple: "bg-purple-600 text-white border-purple-600 hover:bg-purple-700",
  pink: "bg-pink-600 text-white border-pink-600 hover:bg-pink-700",
};

export const sidebarTitleLinkClasses: Record<BorderThemeId, string> = {
  red: "text-red-500 hover:text-red-600",
  blue: "text-blue-600 hover:text-blue-700",
  green: "text-green-600 hover:text-green-700",
  yellow: "text-yellow-600 hover:text-yellow-700",
  purple: "text-purple-600 hover:text-purple-700",
  pink: "text-pink-600 hover:text-pink-700",
};

/** Small preview swatches for the picker (dark / light). */
export const themePreviewColors: Record<BorderThemeId, [string, string]> = {
  red: ["#d21404", "#fc6b5f"],
  blue: ["#1d4ed8", "#7dd3fc"],
  green: ["#15803d", "#4ade80"],
  yellow: ["#facc15", "#fef9c3"],
  purple: ["#7e22ce", "#d8b4fe"],
  pink: ["#be185d", "#fbcfe8"],
};

/** Cookbook grid cards: rotate through pastels per cookbook id. */
export const cookbookCardBgClasses: Record<BorderThemeId, string[]> = {
  red: ["bg-red-100", "bg-red-200", "bg-red-300", "bg-pink-100", "bg-pink-200", "bg-pink-300"],
  blue: ["bg-blue-100", "bg-blue-200", "bg-sky-100", "bg-sky-200", "bg-blue-50", "bg-sky-50"],
  green: ["bg-green-100", "bg-green-200", "bg-emerald-100", "bg-emerald-200", "bg-lime-100", "bg-green-50"],
  yellow: ["bg-yellow-100", "bg-yellow-50", "bg-amber-100", "bg-amber-50", "bg-yellow-200", "bg-amber-100"],
  purple: ["bg-purple-100", "bg-purple-200", "bg-violet-100", "bg-violet-200", "bg-fuchsia-100", "bg-purple-50"],
  pink: ["bg-pink-100", "bg-pink-200", "bg-rose-100", "bg-rose-200", "bg-fuchsia-100", "bg-pink-50"],
};

/** Single background for recipe cards. */
export const recipeCardBgClasses: Record<BorderThemeId, string> = {
  red: "bg-red-100",
  blue: "bg-blue-100",
  green: "bg-green-100",
  yellow: "bg-yellow-100",
  purple: "bg-purple-100",
  pink: "bg-pink-100",
};

/** Card title text — dark tint of each theme. */
export const cardTitleTextClasses: Record<BorderThemeId, string> = {
  red: "text-red-900",
  blue: "text-blue-900",
  green: "text-green-900",
  yellow: "text-amber-950",
  purple: "text-purple-900",
  pink: "text-pink-900",
};

/** Subtle border tint to match theme (still reads as a frame). */
export const cardBorderClasses: Record<BorderThemeId, string> = {
  red: "border-red-900/25",
  blue: "border-blue-900/25",
  green: "border-green-900/25",
  yellow: "border-amber-900/25",
  purple: "border-purple-900/25",
  pink: "border-pink-900/25",
};
