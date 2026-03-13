import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCookbook } from "../../api/cookbooks"; // assume listRecipes fetches recipes by cookbook_id
import type { Cookbook as CookbookType, Recipe } from "../../../types/types";
import { RecipeCard } from "../../components/cards/RecipeCard";
import { listRecipes } from "../../api/recipes";
import CookbookShareModal from "../../components/CookbookShareModal";

export default function Cookbook() {
  const { id } = useParams<{ id: string }>();
  const [cookbook, setCookbook] = useState<CookbookType | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingCookbook, setLoadingCookbook] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!id) return;

    const cookbookId = Number(id);
    if (isNaN(cookbookId)) {
      setError("Invalid cookbook ID");
      setLoadingCookbook(false);
      setLoadingRecipes(false);
      return;
    }

    // Fetch the cookbook
    getCookbook(cookbookId)
      .then((data) => setCookbook(data))
      .catch((err) => setError("Failed to load cookbook: " + err.message))
      .finally(() => setLoadingCookbook(false));

    // Fetch recipes
    listRecipes(cookbookId)
      .then((data) => setRecipes(data))
      .catch((err) => setError("Failed to load recipes: " + err.message))
      .finally(() => setLoadingRecipes(false));
  }, [id]);

  if (loadingCookbook || loadingRecipes) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!cookbook) return <p>Cookbook not found</p>;

  return (
    <div className="py-6">
      {/* Title + Add Recipe button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-semibold">{cookbook.name}</h1>
        <div className="flex items-center gap-10">
          {/* TODO: Disable adding recipe button if user is not a contributor or admin */}
          <button disabled={false} className="w-30">
            <Link to={`/cookbook/${id}/recipe/new`}>Add recipe</Link>
          </button>

          {/* TODO: Disable Manage Access button if user is not admin */}
          <button
            onClick={() => setShowShare(true)}
            className="w-35"
            disabled={false}
          >
            Manage Access
          </button>
        </div>
      </div>

      {/* Recipes list */}
      {recipes.length === 0 ? (
        <p className="text-gray-500">No recipes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
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
