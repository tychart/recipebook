import { Link, useParams } from "react-router-dom";
import type { Recipe } from "../../../shared/types/recipe";
import RecipeForm from "../components/RecipeForm";

export default function RecipeNew() {
  const { cookbookId } = useParams<{ cookbookId?: string }>();


  const emptyRecipe: Recipe = {
    recipe_id: 0,
    recipe_name: "",
    instructions: "",
    notes: "",
    description: "",
    servings: 1,
    creator_id: 1, // TODO: replace with auth user id
    modified_dttm: new Date().toISOString(),
    category: "Main",
    recipe_image_url: "",
    recipe_tags: "",
    book_id: cookbookId ? Number(cookbookId) : 0,
    ingredients: [],
  };

  const handleCreate = (recipe: Recipe) => {
    const payload: Recipe = {
      ...recipe,
      book_id: cookbookId ? Number(cookbookId) : recipe.book_id,
      modified_dttm: new Date().toISOString(),
    };

    console.log("POST recipe:", payload);

    // TODO: Replace with real API call
  };

  return (
    <>
      {/* Header (mirrors RecipeEdit layout) */}
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

      {/* Shared Form */}
      <RecipeForm
        initialData={emptyRecipe}
        onSubmit={handleCreate}
        submitLabel="Create Recipe"
      />
    </>
  );
}