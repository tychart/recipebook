import type { Ingredient } from "../../../types/types";
import { FormattedIngredientAmount } from "./FormattedIngredientAmount";

interface IngredientListProps {
  ingredients: Ingredient[];
}

export default function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <div>
      <h2 className="font-[var(--font-display)] text-2xl font-semibold mb-4 text-[var(--text-primary)]">
        Ingredients
      </h2>
      <ul className="space-y-3">
        {ingredients.map((ing) => (
          <li
            key={ing.ingredient_id}
            className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]"
          >
            <FormattedIngredientAmount amount={ing.amount} unit={ing.unit} />
            {" "}
            {ing.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
