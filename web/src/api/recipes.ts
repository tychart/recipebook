import type { Recipe, RecipeInput, InstructionInput } from "../../types/types";
import { authFetch } from "./client";

const API_BASE = "/api/recipe";

/**
 * Normalize recipe from API response to match frontend types.
 * Ensures `instructions` is InstructionInput[]
 */
function normalizeRecipeFromApi(raw: Record<string, any>): Recipe {
  const instructions: InstructionInput[] = Array.isArray(raw.instructions)
    ? raw.instructions.map((i: any, index) => ({
        instruction_id: i.instruction_id,
        recipe_id: i.recipe_id,
        instruction_number: i.instruction_number ?? index + 1,
        instruction_text: i.instruction_text ?? "",
      }))
    : [];

  return { ...raw, instructions } as Recipe;
}

/**
 * List recipes for a cookbook
 */
export async function listRecipes(cookbookId: number): Promise<Recipe[]> {
  const res = await authFetch(`${API_BASE}/list/${cookbookId}`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizeRecipeFromApi) : [];
}

/**
 * Get a single recipe
 */
export const getRecipe = async (id: number): Promise<Recipe> => {
  const res = await authFetch(`${API_BASE}/get/${id}`);
  if (!res.ok) throw new Error("Failed to fetch recipe");
  const data = await res.json();
  return normalizeRecipeFromApi(data);
};

/**
 * Convert InstructionInput[] to backend format
 */
function instructionsForBackend(instructions: InstructionInput[] = []) {
  return instructions.map((i, index) => ({
    instruction_number: i.instruction_number ?? index + 1,
    instruction_text: i.instruction_text,
  }));
}

/**
 * Create a new recipe
 */
export async function createRecipe(recipe: RecipeInput) {
  const cookbookId = recipe.cookbook_id ?? 0;

  const body = {
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
    instructions: instructionsForBackend(recipe.instructions),
  };

  const res = await authFetch(`${API_BASE}/create/${cookbookId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server response:", text);
    throw new Error("Failed to create recipe");
  }

  return res.json();
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(id: number, data: RecipeInput): Promise<Recipe> {
  const body = {
    id,
    name: data.name,
    description: data.description ?? "",
    notes: data.notes ?? null,
    servings: data.servings,
    creator_id: data.creator_id,
    category: data.category ?? "Main",
    image_url: data.image_url ?? null,
    tags: data.tags ?? [],
    cookbook_id: data.cookbook_id ?? 0,
    ingredients: data.ingredients.map((ing) => ({
      amount: ing.amount,
      unit: ing.unit ?? "",
      name: ing.name,
    })),
    instructions: instructionsForBackend(data.instructions),
  };

  const res = await authFetch(`${API_BASE}/edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server response:", text);
    throw new Error("Failed to update recipe");
  }

  const result = await res.json();
  return normalizeRecipeFromApi(result);
}