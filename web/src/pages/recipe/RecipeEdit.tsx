import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Recipe, RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/RecipeForm";
import { getRecipe, updateRecipe } from "../../api/recipes";

export default function RecipeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      try {
        const data = await getRecipe(Number(id));
        setRecipe(data);
      } catch (err) {
        setError("Failed to load recipe");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!recipe) return <p>Recipe not found</p>;

  const recipeInput: RecipeInput = {
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    instructions: recipe.instructions,
    notes: recipe.notes,
    image_url: recipe.image_url,
    ingredients: recipe.ingredients.map((ing) => ({
      amount: ing.amount,
      unit: ing.unit,
      name: ing.name,
    })),
    cookbook_id: recipe.cookbook_id,
  };

  const handleUpdate = async (
    updated: RecipeInput,
    imageFile?: File,
  ) => {
    try {
      await updateRecipe(recipe.id, updated);
      navigate(`/recipe/${recipe.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update recipe");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold">Edit Recipe</h1>
        <Link to={`/recipe/${id}`}>Cancel</Link>
      </div>

      <RecipeForm
        initialData={recipeInput}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </>
  );
}