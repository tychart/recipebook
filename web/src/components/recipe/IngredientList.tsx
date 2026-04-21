import type { Ingredient } from "../../../types/types";

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
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.max(0, ing.amount)} {ing.unit ? `${ing.unit} ` : ""}
            </span>
            {ing.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
