import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { mockRecipe } from "../mocks/mockRecipe";
import type { Recipe } from "../../types/recipe";
import RecipeForm from "../components/RecipeForm";

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

  if (loading) return <p>Loading...</p>;
  if (!recipe) return <p>Recipe not found</p>;

  const handleUpdate = (updated: Recipe) => {
    console.log("PUT recipe:", updated);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold">Edit Recipe</h1>
        <Link to={`/recipe/${id}`}>Cancel</Link>
      </div>

      <RecipeForm
        initialData={recipe}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </>
  );
}