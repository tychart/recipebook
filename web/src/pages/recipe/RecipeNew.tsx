import { Link, useParams, useNavigate } from "react-router-dom";
import type { RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/RecipeForm";
import { createRecipe } from "../../api/recipes";

export default function RecipeNew() {
  const { cookbookId } = useParams<{ cookbookId?: string }>();
  const navigate = useNavigate();

  // Form initial data uses RecipeInput, not full Recipe
  const emptyRecipeInput: RecipeInput = {
    name: "",
    description: "",
    instructions: "",
    notes: "",
    servings: 1,
    image_url: "",
    ingredients: [],
    cookbook_id: cookbookId ? Number(cookbookId) : 0,
  };

const handleCreate = async (recipeInput: RecipeInput, imageFile?: File) => {
  try {
    const result = await createRecipe(recipeInput, imageFile);
    console.log("Created:", result);
    navigate(`/recipe/${result.id}`);
  } catch (error) {
    console.error("Failed to create recipe", error);
    alert("Failed to create recipe");
  }
};

  return (
    <>
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">
            New Recipe
          </h1>

          {cookbookId && (
            <p className="text-sm text-stone-500 mt-1">
              Adding to cookbook: {cookbookId}
            </p>
          )}
        </div>

        <Link
          to={cookbookId ? `/cookbook/${cookbookId}` : "/cookbooks"}
          className="px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
        >
          Cancel
        </Link>
      </div>

      <RecipeForm
        initialData={emptyRecipeInput}
        onSubmit={handleCreate}
        submitLabel="Create Recipe"
      />
    </>
  );
}