/* ===========================
   Ingredient
=========================== */

export interface Ingredient {
  ingredient_id: number;
  recipe_id?: number;
  amount: number;
  name: string;
}

/* ===========================
   Recipe
=========================== */

export interface Recipe {
  recipe_id: number;
  recipe_name: string;
  instructions: string;
  notes?: string;
  author?: string;
  servings: number;

  creator_id?: number;
  modified_dttm?: string;
  category?: string;
  recipe_image?: string;
  recipe_tags?: string[];

  cookbook_id?: number;

  ingredients: Ingredient[];
}