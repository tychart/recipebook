import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Recipe, RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/recipe/RecipeForm";
import { getRecipe, updateRecipe } from "../../api/recipes";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppButton } from "../../components/ui/AppButton";

export default function RecipeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeDraft, setRecipeDraft] = useState<RecipeInput | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File>();
  const [originalImageUrl, setOriginalImageUrl] = useState("");
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



  if (loading) return <p className="py-6 text-sm text-[var(--text-secondary)]">Loading recipe...</p>;
  if (error) return <p className="py-6 text-sm text-rose-600 dark:text-rose-200">{error}</p>;
  if (!recipe) return <p className="py-6 text-sm text-[var(--text-secondary)]">Recipe not found</p>;

  // Backend returns instructions as array of { instruction_number, instruction_text }; form expects string[]
  const instructionsArr = Array.isArray(recipe.instructions)
    ? (recipe.instructions as { instruction_text?: string }[]).map(
        (i) => i.instruction_text ?? ""
      )
    : String(recipe.instructions ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

  const recipeInput: RecipeInput = {
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    instructions: instructionsArr,
    notes: recipe.notes,
    image_url: recipe.image_url,
    ingredients: recipe.ingredients.map((ing) => ({
      amount: ing.amount,
      unit: ing.unit,
      name: ing.name,
    })),
    cookbook_id: recipe.cookbook_id,
    creator_id: recipe.creator_id,
    category: recipe.category,
    tags: recipe.tags,
  };

  useEffect(() => {
    setRecipeDraft(recipeInput);
    setTagInput(recipeInput.tags?.join(", ") ?? "");
    setSelectedImageFile(undefined);
    setOriginalImageUrl(recipeInput.image_url ?? "");
  }, [recipe.id]);

  const handleUpdate = async (
    updated: RecipeInput,
    imageFile?: File,
  ) => {
    try {
      await updateRecipe(recipe.id, updated, imageFile);
      navigate(`/recipe/${recipe.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update recipe");
    }
  };

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        eyebrow="Edit"
        title="Edit Recipe"
        description="Update the recipe details, ingredients, and instructions without changing how the recipe behaves elsewhere in the app."
        actions={
          <Link to={`/recipe/${id}`}>
            <AppButton>Cancel</AppButton>
          </Link>
        }
      />

      {recipeDraft ? (
        <RecipeForm
          recipe={recipeDraft}
          onRecipeChange={setRecipeDraft}
          tagInput={tagInput}
          onTagInputChange={setTagInput}
          selectedImageFile={selectedImageFile}
          onSelectedImageFileChange={setSelectedImageFile}
          originalImageUrl={originalImageUrl}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          categories={undefined}
        />
      ) : null}
    </div>
  );
}
