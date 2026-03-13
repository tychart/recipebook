/* ===========================
   Authtoken
=========================== */

export interface AuthToken {
  authtoken_id: number;
  authtoken: string;
  user_id: number;
  created_dttm: string; // ISO datetime string
}

/* ===========================
   Cookbook
=========================== */

export interface Cookbook {
  id: number;
  name: string;
  owner_id: number;
  categories: string[];
  created_at: string | null;
}

/* ===========================
   Cookbook Users
=========================== */

export type CookbookRole = 'contributor' | 'owner' | 'viewer';

export interface CookbookUser {
  book_id: number;
  user_id: number;
  role: CookbookRole;
  added_dttm: string;
}

/* ===========================
   Ingredient
=========================== */

export interface Ingredient {
  ingredient_id: number;
  recipe_id: number;
  unit?: string;
  amount: number;
  name: string;
}

export interface IngredientInput {
  amount: number;
  unit?: string;
  name: string;
}

/* ===========================
   Recipe
=========================== */

export interface Recipe {
  id: number;
  name: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  notes?: string;
  description?: string;
  servings: number;
  creator_id: number;
  category: string;
  image_url?: string;
  tags?: string[];
  cookbook_id: number;
  modified_at?: string;
}


export interface RecipeInput {
  name: string;
  description?: string;
  servings: number;
  instructions: InstructionInput[];
  notes?: string;
  image_url?: string;
  ingredients: IngredientInput[];
  cookbook_id?: number;
  creator_id?: number;
  category?: string;
  tags?: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
}

/* ===========================
   Instruction
=========================== */

export interface Instruction {
  instruction_id?: number;
  recipe_id?: number;
  instruction_number: number;
  instruction_text: string;
}

export type InstructionInput = Omit<Instruction, "instruction_id" | "recipe_id">;