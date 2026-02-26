import { useState } from "react";
import type { Recipe, Ingredient } from "../../types/recipe";
import RecipeImage from "./recipe/RecipeImage";

interface RecipeFormProps {
  initialData: Recipe;
  onSubmit: (recipe: Recipe) => void;
  submitLabel?: string;
}

export default function RecipeForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
}: RecipeFormProps) {
  const [recipe, setRecipe] = useState<Recipe>(initialData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setRecipe((prev) => ({
      ...prev,
      [name]: name === "servings" ? Number(value) : value,
    }));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number,
  ) => {
    setRecipe((prev) => {
      const updated = [...prev.ingredients];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return { ...prev, ingredients: updated };
    });
  };

  const handleAddIngredient = () => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredient_id: 1, // temporary ID, replace with real one from backend
          amount: 0,
          unit: "",
          name: "",
        } as Ingredient,
      ],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    onSubmit(recipe);
  };

  return (
    <div className="py-10 max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-stone-200 space-y-8">
        {/* Recipe Image */}
        <RecipeImage
          imageUrl={recipe.recipe_image_url}
          editable
          alt={recipe.recipe_name || "Recipe Image"}
          onEditClick={() => {
          }}
          onRemoveClick={() =>
            setRecipe((prev) => ({
              ...prev,
              recipe_image_url: "",
            }))
          }
        />

        {/* Recipe Name */}
        <div>
          <label className="block mb-2 font-medium text-stone-700">
            Recipe Name
          </label>
          <input
            type="text"
            name="recipe_name"
            value={recipe.recipe_name}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 font-medium text-stone-700">
            Description
          </label>
          <textarea
            name="description"
            value={recipe.description ?? ""}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Servings */}
        <div>
          <label className="block mb-2 font-medium text-stone-700">
            Servings
          </label>
          <input
            type="number"
            name="servings"
            value={recipe.servings}
            onChange={handleChange}
            className="w-32 p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-800">
              Ingredients
            </h2>

            <button
              type="button"
              onClick={handleAddIngredient}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-black font-bold hover:bg-amber-600 transition"
            >
              +
            </button>
          </div>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={ingredient.ingredient_id ?? index}
                className="flex gap-3 items-center"
              >
                <input
                  type="number"
                  value={ingredient.amount}
                  onChange={(e) =>
                    handleIngredientChange(
                      index,
                      "amount",
                      Number(e.target.value),
                    )
                  }
                  placeholder="Amount"
                  className="w-24 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                />

                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(e) =>
                    handleIngredientChange(index, "unit", e.target.value)
                  }
                  placeholder="Unit"
                  className="w-28 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                />

                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) =>
                    handleIngredientChange(index, "name", e.target.value)
                  }
                  placeholder="Ingredient"
                  className="flex-1 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="text-red-500 hover:text-red-700 text-xl"
                >
                  ×
                </button>
              </div>
            ))}

            {recipe.ingredients.length === 0 && (
              <p className="text-stone-400 text-sm">
                Click + to add your first ingredient
              </p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block mb-2 font-medium text-stone-700">
            Instructions
          </label>
          <textarea
            name="instructions"
            value={recipe.instructions}
            onChange={handleChange}
            rows={6}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-2 font-medium text-stone-700">Notes</label>
          <textarea
            name="notes"
            value={recipe.notes ?? ""}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-amber-500 text-black font-medium hover:bg-amber-600 transition shadow-sm"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
