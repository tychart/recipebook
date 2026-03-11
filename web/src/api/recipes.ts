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
 * Convert instructions string (frontend) to array of { instruction_number, instruction_text } (backend).
 */
function instructionsToBackendFormat(instructions: string): InstructionBackend[] {
  if (!instructions || !instructions.trim()) return [];
  return instructions
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((instruction_text, i) => ({ instruction_number: i + 1, instruction_text }));
}

/** Normalize instructions from form (string or array from API) to backend format. */
function normalizeInstructionsForBackend(
  instructions: string | InstructionBackend[] | undefined
): InstructionBackend[] {
  if (Array.isArray(instructions)) {
    return instructions.map((ins, i) =>
      typeof ins === "object" && "instruction_text" in ins
        ? { instruction_number: ins.instruction_number ?? i + 1, instruction_text: ins.instruction_text }
        : { instruction_number: i + 1, instruction_text: String(ins) }
    );
  }
  return instructionsToBackendFormat(instructions ?? "");
}

/**
 * Create a new recipe in a cookbook
 * @param recipe RecipeInput object
 * @param imageFile Optional image file
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
    instructions: instructionsToBackendFormat(recipe.instructions ?? ""),
  };
  const res = await authFetch(`${API_BASE}/create/${cookbookId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
    instructions: normalizeInstructionsForBackend(data.instructions),
  };
  const res = await authFetch(`${API_BASE}/edit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server response:", text);
    throw new Error("Failed to update recipe");
  }
  return res.json();
}