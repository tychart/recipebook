/* ===========================
   User
=========================== */

export interface User {
  user_id: number;
  username: string;
  password: string; // hashed
  email: string;
}

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
  book_id: number;
  book_name: string;
  owner_id: number;
  created_dttm: string;
  categories: string; // comma-separated list (default: "Main")
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
  amount: number;
  name: string;
  unit: string; // cups, tbsp, tsp, etc.
}

/* ===========================
   Recipe
=========================== */

export interface Recipe {
  recipe_id: number;
  recipe_name: string;
  instructions: string;
  notes?: string;
  description?: string;
  servings: number; // default: 1

  creator_id: number;
  modified_dttm: string;
  category: string; // default: "Main"

  recipe_image_url?: string;
  recipe_tags?: string; // comma-separated string

  book_id: number;

  ingredients: Ingredient[];
}