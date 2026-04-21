import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCookbook } from "../../api/cookbooks"; // assume listRecipes fetches recipes by cookbook_id
import type { Cookbook as CookbookType, Recipe } from "../../../types/types";
import { RecipeCard } from "../../components/cards/RecipeCard";
import { listRecipes } from "../../api/recipes";
import { useAuth } from "../../context/AuthContext";
import ThreeDotsMenu from "../ThreeDotsMenu";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppButton } from "../../components/ui/AppButton";
import { EmptyState } from "../../components/ui/EmptyState";

export default function Cookbook() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [cookbook, setCookbook] = useState<CookbookType | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingCookbook, setLoadingCookbook] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return (
      <EmptyState
        title="Please log in to view this cookbook."
        description="You’ll be able to browse recipes and cookbook details after signing in."
      />
    );
  }

  if (loadingCookbook || loadingRecipes) return <p className="py-6 text-sm text-[var(--text-secondary)]">Loading cookbook...</p>;
  if (error) return <p className="py-6 text-sm text-rose-600 dark:text-rose-200">{error}</p>;
  if (!cookbook) return <p className="py-6 text-sm text-[var(--text-secondary)]">Cookbook not found</p>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-6">
      <PageHeader
        eyebrow="Cookbook"
        title={cookbook.name}
        description="Browse every recipe in this cookbook, then jump into adding or managing entries without losing context on smaller screens."
        actions={
          <>
            {(userRole === "contributor" || userRole === "owner") && (
            <Link
              to={`/cookbook/${id}/recipe/new`}
            >
              <AppButton variant="primary">Add Recipe</AppButton>
            </Link>
          )}
            <ThreeDotsMenu userRole={userRole} id={id}/>
          </>
        }
      />

      <Link to="/cookbooks" className="app-link inline-flex text-sm font-semibold">
        &larr; Back to Cookbooks
      </Link>

      {recipes.length === 0 ? (
        <EmptyState
          title="No recipes yet."
          description="Start this cookbook with its first recipe, then keep building a collection that stays easy to scan."
        />
      ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
