import type { Cookbook } from "../../types/recipe";
import { mockRecipe } from "./mockRecipe";

export const mockCookbook: Cookbook = {
  book_id: 1,
  book_name: "Jordan's Favorite Recipes",
  owner_id: 1,
  created_dttm: new Date().toISOString(),
  categories: "Main,Breakfast,Dessert,Snacks",
};

export interface CookbookWithRecipes extends Cookbook {
  recipes: typeof mockRecipe[];
}

export const mockCookbookWithRecipes: CookbookWithRecipes = {
  ...mockCookbook,
  recipes: [mockRecipe],
};