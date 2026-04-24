export type IngredientAmountStyle = "unicode" | "ascii";
export type IngredientAmountDensity = "compact" | "normal" | "large";
export type IngredientAmountFallbackMode = "decimal";

export type IngredientAmountDisplayPreferences = {
  enabled: boolean;
  style: IngredientAmountStyle;
  displayDensity: IngredientAmountDensity;
  fallbackMode: IngredientAmountFallbackMode;
};

type FractionCandidate = {
  numerator: number;
  denominator: number;
  value: number;
};

const COMMON_FRACTIONS: FractionCandidate[] = [
  [1, 8],
  [1, 6],
  [1, 5],
  [1, 4],
  [1, 3],
  [3, 8],
  [1, 2],
  [5, 8],
  [2, 3],
  [3, 4],
  [5, 6],
  [7, 8],
].map(([numerator, denominator]) => ({
  numerator,
  denominator,
  value: numerator / denominator,
}));

const UNICODE_FRACTIONS = new Map<string, string>([
  ["1/8", "⅛"],
  ["1/6", "⅙"],
  ["1/5", "⅕"],
  ["1/4", "¼"],
  ["1/3", "⅓"],
  ["3/8", "⅜"],
  ["1/2", "½"],
  ["5/8", "⅝"],
  ["2/3", "⅔"],
  ["3/4", "¾"],
  ["5/6", "⅚"],
  ["7/8", "⅞"],
]);

const COMMON_FRACTION_TOLERANCE = 0.02;

export const DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES: IngredientAmountDisplayPreferences = {
  enabled: true,
  style: "unicode",
  displayDensity: "normal",
  fallbackMode: "decimal",
};

function formatDecimalAmount(amount: number) {
  return String(Math.max(0, amount));
}

function formatFractionText(
  wholeNumber: number,
  numerator: number,
  denominator: number,
  style: IngredientAmountStyle,
) {
  const key = `${numerator}/${denominator}`;
  const fractionText =
    style === "unicode"
      ? (UNICODE_FRACTIONS.get(key) ?? key)
      : key;

  if (wholeNumber <= 0) {
    return fractionText;
  }

  return style === "unicode"
    ? `${wholeNumber} ${fractionText}`
    : `${wholeNumber} ${key}`;
}

export function formatIngredientAmount(
  amount: number,
  preferences: IngredientAmountDisplayPreferences,
) {
  const normalizedAmount = Math.max(0, amount);
  const decimalFallback = formatDecimalAmount(normalizedAmount);

  if (!preferences.enabled || !Number.isFinite(normalizedAmount)) {
    return decimalFallback;
  }

  if (Number.isInteger(normalizedAmount)) {
    return decimalFallback;
  }

  const wholeNumber = Math.floor(normalizedAmount);
  const fractionalPart = normalizedAmount - wholeNumber;

  if (fractionalPart <= COMMON_FRACTION_TOLERANCE) {
    return String(wholeNumber);
  }

  if (1 - fractionalPart <= COMMON_FRACTION_TOLERANCE) {
    return String(wholeNumber + 1);
  }

  let bestCandidate: FractionCandidate | null = null;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (const candidate of COMMON_FRACTIONS) {
    const difference = Math.abs(fractionalPart - candidate.value);
    if (difference < bestDifference) {
      bestDifference = difference;
      bestCandidate = candidate;
    }
  }

  if (!bestCandidate || bestDifference > COMMON_FRACTION_TOLERANCE) {
    return decimalFallback;
  }

  return formatFractionText(
    wholeNumber,
    bestCandidate.numerator,
    bestCandidate.denominator,
    preferences.style,
  );
}
