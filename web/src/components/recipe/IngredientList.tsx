import type { Ingredient } from "../../../../shared/types/recipe";

interface IngredientListProps {
  ingredients: Ingredient[];
}

export default function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Ingredients</h2>
      <ul className="list-disc pl-6">
        {ingredients.map((ing) => (
          <li key={ing.ingredient_id}>
            {ing.amount} {ing.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
