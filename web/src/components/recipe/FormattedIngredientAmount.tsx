import { cn } from "../../lib/cn";
import { formatIngredientAmount } from "../../lib/ingredientAmountDisplay";
import { useIngredientAmountDisplay } from "../../context/IngredientAmountDisplayContext";

type FormattedIngredientAmountProps = {
  amount: number;
  unit?: string;
  className?: string;
};

const densityClasses = {
  compact: "text-sm",
  normal: "text-base",
  large: "text-lg",
} as const;

export function FormattedIngredientAmount({
  amount,
  unit,
  className,
}: FormattedIngredientAmountProps) {
  const { preferences } = useIngredientAmountDisplay();
  const formattedAmount = formatIngredientAmount(amount, preferences);

  return (
    <span
      className={cn(
        "font-semibold text-[var(--text-primary)]",
        densityClasses[preferences.displayDensity],
        className,
      )}
    >
      {formattedAmount}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}
