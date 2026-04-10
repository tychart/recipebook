import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCookbook } from "../../api/cookbooks"; // assume listRecipes fetches recipes by cookbook_id
import type { Cookbook as CookbookType, Recipe } from "../../../types/types";
import { RecipeCard } from "../../components/cards/RecipeCard";
import { listRecipes } from "../../api/recipes";
import { useAuth } from "../../context/AuthContext";
import CookbookShareModal from "../../components/CookbookShareModal";

export default function Cookbook() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [cookbook, setCookbook] = useState<CookbookType | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingCookbook, setLoadingCookbook] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      setLoadingCookbook(false);
      setLoadingRecipes(false);
      return;
    }

    const cookbookId = Number(id);
    if (isNaN(cookbookId)) {
      setError("Invalid cookbook ID");
      setLoadingCookbook(false);
      setLoadingRecipes(false);
      return;
    }

    // Fetch the cookbook (authFetch sends Bearer token from localStorage)
    getCookbook(cookbookId)
      .then((data) => {
        setCookbook(data);
        setUserRole(data.current_user_role || null);
      })
      .catch((err) => setError("Failed to load cookbook: " + err.message))
      .finally(() => setLoadingCookbook(false));

    // Fetch recipes
    listRecipes(cookbookId)
      .then((data) => setRecipes(data))
      .catch((err) => setError("Failed to load recipes: " + err.message))
      .finally(() => setLoadingRecipes(false));
  }, [id, user]);

  if (!user) {
    return <p>Please log in to view this cookbook.</p>;
  }

  if (loadingCookbook || loadingRecipes) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!cookbook) return <p>Cookbook not found</p>;

  return (
    <div className="py-6">
      {/* Title + Add Recipe button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-semibold">{cookbook.name}</h1>
        <div className="flex items-center gap-10">
          {(userRole === "contributor" || userRole === "owner") && (
            <Link
              to={`/cookbook/${id}/recipe/new`}
              className="block w-40 px-4 py-2 rounded-md text-sm font-medium transition border bg-white text-black border-black hover:bg-stone-100 cursor-pointer no-underline text-center"
            >
              Add recipe
            </Link>
          )}

          {userRole === "owner" && (
            <Link
              to={`/cookbook/${id}/edit`}
              className="block w-40 px-4 py-2 rounded-md text-sm font-medium transition border bg-white text-black border-black hover:bg-stone-100 cursor-pointer no-underline text-center"
            >
              Edit cookbook
            </Link>
          )}

          {userRole === "owner" && (
            <button
              onClick={() => setShowShare(true)}
              className="w-40 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
              title="Only owners can manage access"
            >
              Manage Access
            </button>
          )}
        </div>
      </div>

      <Link
        to="/cookbooks"
        className="inline-block mb-4 text-sm hover:underline"
      >
        &larr; Back to Cookbooks
      </Link>

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

      {userRole === "owner" && (
        <div className="flex justify-left py-6">
          <Link
            to={`/cookbooks`}
            className="px-4 py-3 bg-red-500 text-white rounded-lg text-sm font-semibold text-center shadow-lg hover:bg-red-600 transition-colors"
          >
            Delete cookbook
          </Link>
        </div>
      )}
    </div>
  );
}
