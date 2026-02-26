import type { Recipe, RecipeInput } from "../../types/types";

const API_BASE = "http://localhost:8000/api/recipe"; // adjust port if needed


// Get recipe function
export const getRecipe = async (id: number): Promise<Recipe> => {
  const response = await fetch(`${API_BASE}/get/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recipe");
  }

  const data: Recipe = await response.json();
  return data;
};


// Create recipe function
export const createRecipe = async (
  recipe: RecipeInput,
  imageFile?: File
): Promise<Recipe> => {
  const formData = new FormData();

  formData.append("metadata", JSON.stringify(recipe));

  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch(
    `${API_BASE}/create/${recipe.cookbook_id}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create recipe");
  }

  return response.json();
};


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