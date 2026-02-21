import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { mockRecipe } from "../mocks/mockRecipe";
import type { Recipe, Ingredient } from "../../../shared/types/recipe";

export default function RecipeEdit() {
  const { id } = useParams<{ id: string }>();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecipe(mockRecipe);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return <p className="text-stone-600">Loading...</p>;
  if (!recipe) return <p className="text-stone-600">Recipe not found</p>;

  /* Handlers */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRecipe(prev => prev ? { ...prev, [name]: value } : prev);
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    setRecipe(prev => {
      if (!prev) return prev;

      const updated = [...prev.ingredients];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return { ...prev, ingredients: updated };
    });
  };

  const handleSave = () => {
    console.log("Saving recipe (placeholder):", recipe);
    alert("Save functionality not implemented yet.");
  };

  return (
    <div className="py-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-stone-800">
          Edit Recipe
        </h1>

        <Link
          to={`/recipe/${id}`}
          className="px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
        >
          Cancel
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-stone-200 space-y-8">

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
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
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
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
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
            className="w-32 p-3 rounded-lg border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Ingredients */}
        <div>
          <h2 className="text-xl font-semibold text-stone-800 mb-4">
            Ingredients
          </h2>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={ingredient.ingredient_id} className="flex gap-3">
                <input
                  type="number"
                  value={ingredient.amount}
                  onChange={(e) =>
                    handleIngredientChange(index, "amount", Number(e.target.value))
                  }
                  className="w-24 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                />
                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(e) =>
                    handleIngredientChange(index, "unit", e.target.value)
                  }
                  className="w-28 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                />
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) =>
                    handleIngredientChange(index, "name", e.target.value)
                  }
                  className="flex-1 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                />
              </div>
            ))}
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
          <label className="block mb-2 font-medium text-stone-700">
            Notes
          </label>
          <textarea
            name="notes"
            value={recipe.notes ?? ""}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-amber-500 text-black font-medium hover:bg-amber-600 transition shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}