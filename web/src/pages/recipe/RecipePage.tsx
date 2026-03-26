import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Instructions from "../../components/recipe/Instructions";
import IngredientList from "../../components/recipe/IngredientList";
import Notes from "../../components/recipe/Notes";
import type { Recipe } from "../../../types/types";
import RecipeImage from "../../components/recipe/RecipeImage";
import { getRecipe } from "../../api/recipes";
import RecipeShareModal from "../../components/RecipeShareModal";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchRecipe = async () => {
      try {
        const data = await getRecipe(Number(id));
        setRecipe(data);
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Failed to load recipe. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!recipe) return <p>Recipe not found</p>;

  // const tags = recipe.recipe_tags
  //   ? recipe.recipe_tags.split(",").map((tag: string) => tag.trim())
  //   : [];

  return (
    <div className="py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold">{recipe.name}</h1>

        <div className="flex items-center gap-10">
          {/* TODO: Disable editing button if user is not the creator of the recipe */}
          <Link
            to={`/recipe/${id}/edit`}
            className="block w-20 px-4 py-2 rounded-md text-sm font-medium transition border bg-white text-black border-black hover:bg-stone-100 cursor-pointer no-underline text-center"
          >
            Edit
          </Link>

          <button onClick={() => setShowShare(true)} className="w-20">
            Share
          </button>
        </div>
      </div>

      {/* Image */}
      <RecipeImage imageUrl={recipe.image_url} alt={recipe.name} />

      {/* Description */}
      {recipe.description && (
        <p className="mb-4 text-gray-600 dark:text-black-300 text-center">
          {recipe.description}
        </p>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-100 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Content Sections - ingredients and instructions side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-amber-200 rounded-[10px] p-4">
          <IngredientList ingredients={recipe.ingredients} />
        </div>
        <div className="bg-white border border-amber-200 rounded-[10px] p-4">
          <Instructions instructions={recipe.instructions} />
        </div>
      </div>

      {recipe.notes && <Notes notes={recipe.notes} />}

      {showShare && id && (
        <RecipeShareModal recipeId={id} onClose={() => setShowShare(false)} />
      )}
      {/* Meta Info - at bottom */}
      <div className="mt-6 text-sm text-gray-600 dark:text-black-300 space-y-1 text-center">
        <p>Serves {recipe.servings}</p>
        <p>Category: {recipe.category}</p>
        <p>
          Last updated:{" "}
          {recipe.modified_at
            ? new Date(recipe.modified_at).toLocaleDateString()
            : "N/A"}
        </p>
      </div>
    </div>
  );
}
