import type { Recipe, RecipeInput } from "../../types/types";
import { authFetch } from "./client";

const API_BASE = "/api/recipe";


/**
 * Backend returns instructions as array of { instruction_number, instruction_text }.
 * Normalize to string for frontend display (RecipePage, Instructions component).
 */
function normalizeRecipeFromApi(raw: Record<string, unknown>): Recipe {
  const instructionsStr = Array.isArray(raw.instructions)
    ? (raw.instructions as { instruction_text?: string }[])
        .map((i) => (i && typeof i.instruction_text === "string" ? i.instruction_text : ""))
        .join("\n")
    : String(raw.instructions ?? "");
  return { ...raw, instructions: instructionsStr } as Recipe;
}

/**
 * Fetch all recipes for a given cookbook.
 * @param cookbookId - The ID of the cookbook
 * @returns Array of Recipe objects
 */
export async function listRecipes(cookbookId: number): Promise<Recipe[]> {
  const res = await authFetch(`${API_BASE}/list/${cookbookId}`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizeRecipeFromApi) : [];
}

// Get recipe function
export const getRecipe = async (id: number): Promise<Recipe> => {
  const response = await authFetch(`${API_BASE}/get/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recipe");
  }

  const data = await response.json();
  return normalizeRecipeFromApi(data);
};


type InstructionBackend = { instruction_number: number; instruction_text: string };

/**
 * Convert instructions (string or string[]) to backend format.
 */
function instructionsToBackendFormat(
  instructions: string | string[] | undefined
): InstructionBackend[] {
  if (Array.isArray(instructions)) {
    return instructions
      .map((text) => (typeof text === "string" ? text : "").trim())
      .filter(Boolean)
      .map((instruction_text, i) => ({ instruction_number: i + 1, instruction_text }));
  }
  if (typeof instructions === "string" && instructions.trim()) {
    return instructions
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((instruction_text, i) => ({ instruction_number: i + 1, instruction_text }));
  }
  return [];
}

/**
 * Create a new recipe in a cookbook
 * @param recipe RecipeInput object
 * @param imageFile Optional image file
 */
export async function createRecipe(recipe: RecipeInput, imageFile?: File) {
  return createRecipeWithImage(recipe, imageFile);
}


function buildRecipePayload(recipe: RecipeInput, id?: number) {
  const cookbookId = recipe.cookbook_id ?? 0;
  return {
    ...(id !== undefined ? { id } : {}),
    name: recipe.name,
    description: recipe.description ?? "",
    notes: recipe.notes ?? null,
    servings: recipe.servings,
    creator_id: recipe.creator_id,
    category: recipe.category ?? "Main",
    image_url: recipe.image_url ?? null,
    tags: recipe.tags ?? [],
    cookbook_id: cookbookId,
    ingredients: recipe.ingredients.map((ing) => ({
      amount: ing.amount,
      unit: ing.unit ?? "",
      name: ing.name,
    })),
    instructions: instructionsToBackendFormat(recipe.instructions ?? ""),
  };
}


function buildRecipeFormData(recipe: RecipeInput, imageFile?: File, id?: number): FormData {
  const formData = new FormData();
  formData.append("recipe", JSON.stringify(buildRecipePayload(recipe, id)));
  if (imageFile) {
    formData.append("image", imageFile);
  }
  return formData;
}


export async function createRecipeWithImage(recipe: RecipeInput, imageFile?: File) {
  const cookbookId = recipe.cookbook_id ?? 0;
  const res = await authFetch(`${API_BASE}/create/${cookbookId}`, {
    method: "POST",
    body: buildRecipeFormData(recipe, imageFile),
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
  imageFile?: File,
): Promise<Recipe> {
  const res = await authFetch(`${API_BASE}/edit`, {
    method: "POST",
    body: buildRecipeFormData(
      {
        ...data,
        instructions: data.instructions ?? "",
      },
      imageFile,
      id,
    ),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server response:", text);
    throw new Error("Failed to update recipe");
  }
  return res.json();
}


export async function deleteRecipe(recipeId: number): Promise<{ message: string }> {
  const res = await authFetch(`${API_BASE}/delete/${recipeId}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to delete recipe");
  }

  return res.json();
}

export async function copyRecipe(
  recipeId: number,
  cookbookId: number
): Promise<Recipe> {
  const res = await authFetch(`${API_BASE}/copy/${recipeId}/${cookbookId}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to copy recipe");
  }

  const data = await res.json();
  return normalizeRecipeFromApi(data);
}
