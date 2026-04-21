import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Instructions from "../../components/recipe/Instructions";
import IngredientList from "../../components/recipe/IngredientList";
import Notes from "../../components/recipe/Notes";
import type { Recipe } from "../../../types/types";
import type { Cookbook } from "../../../types/types";
import { getCookbook } from "../../api/cookbooks";
import RecipeImage from "../../components/recipe/RecipeImage";
import { getRecipe, deleteRecipe, copyRecipe } from "../../api/recipes";
import RecipeShareModal from "../../components/RecipeShareModal";
import { Trash2 } from "lucide-react";
import CopyRecipeDialog from "../../components/recipe/CopyRecipeDialog";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppButton } from "../../components/ui/AppButton";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [parentCookbook, setParentCookbook] = useState<Cookbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      try {
        const data = await getRecipe(Number(id));
        setRecipe(data);

        try {
          const cookbookData = await getCookbook(data.cookbook_id);
          setParentCookbook(cookbookData);
        } catch (err) {
          console.error("Error fetching cookbook:", err);
          setParentCookbook(null);
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Failed to load recipe. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (!id) return <p className="py-6 text-sm text-[var(--text-secondary)]">Invalid recipe</p>;

  const handleDelete = async () => {
    if (!recipe || deleting) return;

    const confirmed = window.confirm(
      `Delete "${recipe.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteRecipe(recipe.id);

      if (parentCookbook) {
        navigate(`/cookbook/${parentCookbook.id}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Failed to delete recipe:", err);
      alert("Failed to delete recipe.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyRecipe = async (targetCookbookId: number) => {
    if (!recipe) return;

    try {
      const copiedRecipe = await copyRecipe(recipe.id, targetCookbookId);
      setShowCopyDialog(false);
      navigate(`/recipe/${copiedRecipe.id}`);
    } catch (err) {
      console.error("Failed to copy recipe:", err);
      throw err;
    }
  };

  if (loading) return <p className="py-6 text-sm text-[var(--text-secondary)]">Loading recipe...</p>;
  if (error) return <p className="py-6 text-sm text-rose-600 dark:text-rose-200">{error}</p>;
  if (!recipe) return <p className="py-6 text-sm text-[var(--text-secondary)]">Recipe not found</p>;

  return (
    <div className="print-container py-6 max-w-5xl mx-auto space-y-6">
      <div className="no-print">
        <PageHeader
          eyebrow={recipe.category || "Recipe"}
          title={recipe.name}
          description={recipe.description || "A kitchen-ready view with larger controls, clear sections, and a calmer reading rhythm."}
          actions={
            <>
              <Link to={`/recipe/${id}/edit`}>
                <AppButton>Edit</AppButton>
              </Link>
              <AppButton onClick={() => setShowShare(true)}>Share</AppButton>
              <AppButton onClick={() => window.print()}>Print</AppButton>
              <AppButton onClick={() => setShowCopyDialog(true)}>Copy</AppButton>
              <AppButton
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete recipe"
                title="Delete recipe"
              >
                <Trash2 size={18} aria-hidden="true" />
              </AppButton>
            </>
          }
        />
      </div>

      {parentCookbook && (
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          <Link to={`/cookbook/${parentCookbook.id}`} className="app-link font-semibold">
            ← {parentCookbook.name}
          </Link>
        </p>
      )}

      <h1 className="hidden print:block text-3xl text-center mb-4">
        {recipe.name}
      </h1>

      <RecipeImage imageUrl={recipe.image_url} alt={recipe.name} />

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 no-print">
          {recipe.tags.map((tag: string) => (
            <span key={tag} className="app-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <div className="app-panel">
          <IngredientList ingredients={recipe.ingredients} />
        </div>

        <div className="app-panel">
          <Instructions instructions={recipe.instructions} />
        </div>
      </div>

      {recipe.notes && <Notes notes={recipe.notes} />}

      {showShare && id && (
        <div className="no-print">
          <RecipeShareModal recipeId={id} onClose={() => setShowShare(false)} />
        </div>
      )}

      <CopyRecipeDialog
        recipeId={recipe.id}
        isOpen={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        onCopy={handleCopyRecipe}
      />

      <div className="app-panel mt-6 text-sm text-[var(--text-secondary)] space-y-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <label htmlFor="servings" className="font-semibold text-[var(--text-primary)]">Serves</label>
          <input
            id="servings"
            type="number"
            min="1"
            value={recipe.servings}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setRecipe({
                ...recipe,
                servings: isNaN(newValue) || newValue < 1 ? 1 : newValue,
              });
            }}
            className="app-input w-24 text-center"
          />
        </div>

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
