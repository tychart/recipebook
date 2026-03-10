import { Link, useParams } from "react-router-dom";
import { mockCookbookWithRecipes } from "../mocks/mockCookbook";
import { RecipeCard } from "../components/cards/RecipeCard"; // adjust path if needed
import { useState } from "react";
import CookbookShareModal from "../components/CookbookShareModal";

/**
 * Single cookbook view. Shows the cookbook title, an "Add recipe"
 * button, and a grid of recipe cards.
 */
export default function Cookbook() {
  const { id } = useParams<{ id: string }>();
  const cookbook = mockCookbookWithRecipes; // TODO: replace with real API call using id
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{cookbook.book_name}</h1>

        <div className="flex items-center gap-10">
          {/* TODO: Disable adding recipe button if user is not a contributor or admin */}
          <button disabled={false}>
            <Link to={`/cookbook/${id}/recipe/new`}>Add recipe</Link>
          </button>

          {/* TODO: Disable Manage Access button if user is not admin */}
          <button
            onClick={() => setShowShare(true)}
            className="share-button"
            disabled={false}
          >
            Manage Access
          </button>
        </div>
      </div>

      {/* Recipe grid */}
      {cookbook.recipes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {cookbook.recipes.map((recipe) => (
            <RecipeCard key={recipe.recipe_id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No recipes in this cookbook yet.</p>
      )}

      {showShare && id && (
        <CookbookShareModal
          cookbookId={id}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
