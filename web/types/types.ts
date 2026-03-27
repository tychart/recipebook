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

export interface CookbookMember {
  user_id: number;
  username: string;
  email: string;
}

export interface Cookbook {
  id: number;
  name: string;
  owner_id: number;
  categories: string[];
  created_at: string | null;
  current_user_role?: 'owner' | 'contributor' | 'viewer'; // Optional for list endpoints
  contributors?: CookbookMember[]; // Optional for list endpoints
  viewers?: CookbookMember[];      // Optional for list endpoints
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
   Share Cookbook Request
=========================== */

export interface ShareCookbookRequest {
  book_id: number;
  email: string;
  role: CookbookRole;
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
  instructions: string;
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
  instructions: string[];
  notes?: string;
  image_url?: string;
  ingredients: IngredientInput[];
  cookbook_id?: number;
  creator_id?: number;
  category?: string;
  tags?: string[]; // array of tag strings
}

export interface SemanticSearchResult {
  recipe_id: number;
  recipe_name: string;
  cookbook_id: number;
  cookbook_name: string;
  image_url?: string | null;
  category: string;
  tags?: string[];
  score: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
}
