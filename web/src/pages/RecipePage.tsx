import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Instructions from "../components/recipe/Instructions";
import IngredientList from "../components/recipe/IngredientList";
import Notes from "../components/recipe/Notes";
import { mockRecipe } from "../mocks/mockRecipe";
import type { Recipe } from "../../types/recipe";
import RecipeImage from "../components/recipe/RecipeImage";
import ShareModal from "../components/ShareModal";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecipe(mockRecipe);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!recipe) return <p>Recipe not found</p>;

  const tags = recipe.recipe_tags
    ? recipe.recipe_tags.split(",").map((tag: string) => tag.trim())
    : [];

  return (
    <div className="py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold">{recipe.recipe_name}</h1>

        <div className="flex items-center gap-10">
          <button>
            <Link to={`/recipe/${id}/edit`}>Edit</Link>
          </button>

          <button onClick={() => setShowShare(true)} className="share-button">
            Share
          </button>
        </div>
      </div>

      {/* Image */}
      <RecipeImage
        imageUrl={recipe.recipe_image_url}
        alt={recipe.recipe_name}
      />

      {/* Description */}
      {recipe.description && (
        <p className="mb-4 text-gray-600 dark:text-black-300 text-center">
          {recipe.description}
        </p>
      )}

      {/* Meta Info */}
      <div className="mb-6 text-sm text-gray-600 dark:text-black-300 space-y-1 text-center">
        <p>Serves {recipe.servings}</p>
        <p>Category: {recipe.category}</p>
        <p>
          Last updated: {new Date(recipe.modified_dttm).toLocaleDateString()}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-100 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Content Sections */}
      <IngredientList ingredients={recipe.ingredients} />
      <Instructions instructions={recipe.instructions} />
      {recipe.notes && <Notes notes={recipe.notes} />}
      {showShare && id && (
        <ShareModal recipeId={id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
