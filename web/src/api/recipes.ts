import type { Recipe, RecipeInput } from "../../types/types";

const API_BASE = "/api/recipe";


/**
 * Fetch all recipes for a given cookbook.
 * @param cookbookId - The ID of the cookbook
 * @returns Array of Recipe objects
 */
export async function listRecipes(cookbookId: number): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/list/${cookbookId}`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return res.json();
}

// Get recipe function
export const getRecipe = async (id: number): Promise<Recipe> => {
  const response = await fetch(`${API_BASE}/get/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recipe");
  }

  const data: Recipe = await response.json();
  return data;
};


/**
 * Create a new recipe in a cookbook
 * @param recipe RecipeInput object
 * @param imageFile Optional image file
 */
export async function createRecipe(recipe: RecipeInput) {
  const res = await fetch(`${API_BASE}/create/${recipe.cookbook_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipe),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server response:", text);
    throw new Error("Failed to create recipe");
  }

  return res.json();
}


// Update recipe function
export async function updateRecipe(
  id: number,
  data: RecipeInput,
): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update recipe");
  return res.json();
}