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

  if (!id) return <p>Invalid recipe</p>;

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!recipe) return <p>Recipe not found</p>;

  return (
    <div className="print-container py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 no-print">
        <h1 className="text-3xl font-semibold">{recipe.name}</h1>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          <Link
            to={`/recipe/${id}/edit`}
            className="block w-20 px-4 py-2 rounded-md text-sm font-medium border bg-white text-black border-black hover:bg-stone-100 text-center"
          >
            Edit
          </Link>

          <button
            onClick={() => setShowShare(true)}
            className="w-20 px-4 py-2 rounded-md text-sm font-medium transition border bg-white text-black border-black hover:bg-stone-100"
          >
            Share
          </button>

          <button
            onClick={() => window.print()}
            className="w-20 px-4 py-2 rounded-md text-sm font-medium transition border bg-white text-black border-black hover:bg-stone-100"
          >
            Print
          </button>

          <button
            onClick={() => setShowCopyDialog(true)}
            className="w-20 px-4 py-2 rounded-md text-sm font-medium transition border bg-white text-black border-black hover:bg-stone-100"
          >
            Copy
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete recipe"
            title="Delete recipe"
            className="w-11 h-10 flex items-center justify-center rounded-md text-sm font-medium transition border border-red-300 bg-white text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {parentCookbook && (
        <p className="text-sm text-gray-600 dark:text-black-300 mb-5">
          <Link to={`/cookbook/${parentCookbook.id}`} className="font-medium">
            ← {parentCookbook.name}
          </Link>
        </p>
      )}

      <h1 className="hidden print:block text-3xl text-center mb-4">
        {recipe.name}
      </h1>

      <RecipeImage imageUrl={recipe.image_url} alt={recipe.name} />

      {recipe.description && (
        <p className="mb-4 text-gray-600 dark:text-black-300 text-center whitespace-pre-wrap">
          {recipe.description}
        </p>
      )}

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 no-print">
          {recipe.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm bg-gray-200 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

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

      <div className="mt-6 text-sm text-gray-600 dark:text-black-300 space-y-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="servings">Serves:</label>
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
            className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
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
