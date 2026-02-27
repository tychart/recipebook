import { Link, useParams, useNavigate } from "react-router-dom";
import type { Cookbook, RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/recipe/RecipeForm";
import { createRecipe } from "../../api/recipes";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { getCookbook } from "../../api/cookbooks";

export default function RecipeNew() {
  const { cookbookId } = useParams<{ cookbookId?: string }>();
  const navigate = useNavigate();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);

useEffect(() => {
  if (!cookbookId) return;

  const fetchCookbook = async () => {
    try {
      const data = await getCookbook(Number(cookbookId));
      setCookbook(data);
    } catch (error) {
      console.error("Failed to fetch cookbook", error);
    }
  };

  fetchCookbook();
}, [cookbookId]);

  const { user } = useAuth();
  if (!user) {
    return <p>Please log in to create a recipe.</p>;
  }

const emptyRecipeInput: RecipeInput = {
  name: "",
  description: "",
  instructions: "",
  notes: "",
  servings: 1,
  image_url: "",
  ingredients: [],
  cookbook_id: cookbookId ? Number(cookbookId) : 0,
  creator_id: user.id,
  category: "Main", // default category
  tags: [],
};

const handleCreate = async (recipeInput: RecipeInput, imageFile?: File) => {
  try {
    const result = await createRecipe(recipeInput, imageFile);
    console.log("Created:", result);
    navigate(`/recipe/${result.recipe.id}`);
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
              Adding to: {cookbook ? cookbook.name : "Loading..."}
            </p>
          )}
        </div>

        <Link
  to={cookbookId ? `/cookbook/${cookbookId}` : "/cookbooks"}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
             border border-stone-300 text-stone-700
             hover:bg-stone-100 hover:border-stone-400
             transition-all duration-200"
>
  ← Cancel
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