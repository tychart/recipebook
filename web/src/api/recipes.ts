import type { Recipe, RecipeInput } from "../../types/types";

const API_BASE = "http://localhost:8000/api/recipe"; // adjust port if needed


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
export async function createRecipe(recipe: RecipeInput, imageFile?: File) {
  const formData = new FormData();
  formData.append("metadata", JSON.stringify(recipe)); // backend expects `metadata` field
  if (imageFile) formData.append("image", imageFile); // optional image

  const res = await fetch(`${API_BASE}/create/${recipe.cookbook_id}`, {
    method: "POST",
    body: formData, // multipart/form-data
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server response:", text);
    throw new Error("Failed to create recipe");
  }

  return res.json(); // returns { message, recipe, image_filename? }
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