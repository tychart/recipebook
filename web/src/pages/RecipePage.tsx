import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Instructions from "../components/recipe/Instructions";
import IngredientList from "../components/recipe/IngredientList";
import Notes from "../components/recipe/Notes";
import { mockRecipe } from "../mocks/mockRecipe";
import type { Recipe } from "../../../shared/types/recipe";


export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay (optional)
    const timer = setTimeout(() => {
      // TODO: Replace mockRecipe with real API call when backend is ready.
      // Example:
      //
      // const res = await fetch(`/api/recipes/${id}`);
      // if (!res.ok) throw new Error("Failed to fetch recipe");
      // const data = await res.json();
      // setRecipe(data);
      //
      // For now, we use mockRecipe to allow frontend development
      // without depending on the backend.
      setRecipe(mockRecipe);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!recipe) return <p>Recipe not found</p>;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {recipe.recipe_name}
        </h1>

        <Link
          to={`/recipe/${id}/edit`}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100"
        >
          Edit
        </Link>
      </div>

      <p className="mb-6 text-gray-500 dark:text-gray-400">
        Serves {recipe.servings}
      </p>

      <IngredientList ingredients={recipe.ingredients} />
      <Instructions instructions={recipe.instructions} />
      <Notes notes={recipe.notes} />
    </div>
  );
}
