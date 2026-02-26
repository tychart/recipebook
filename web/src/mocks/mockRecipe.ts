import type { Recipe } from "../../types/recipe";

export const mockRecipe: Recipe = {
  recipe_id: 1,
  recipe_name: "Classic Pancakes",
  instructions: `
1. Mix dry ingredients together.
2. Whisk in milk and eggs.
3. Heat skillet over medium heat.
4. Pour batter and cook until golden brown.
  `,
  notes: "Add blueberries or chocolate chips.",
  description: "Fluffy homemade pancakes perfect for breakfast.",
  servings: 4,

  creator_id: 1,
  modified_dttm: new Date().toISOString(),
  category: "Main",
  recipe_image_url: "../../pancake.png",
  recipe_tags: "breakfast,sweet,quick",

  book_id: 1,

  ingredients: [
    {
      ingredient_id: 1,
      recipe_id: 1,
      amount: 2,
      name: "Flour",
      unit: "cups"
    },
    {
      ingredient_id: 2,
      recipe_id: 1,
      amount: 2,
      name: "Eggs",
      unit: "whole"
    },
    {
      ingredient_id: 3,
      recipe_id: 1,
      amount: 1.5,
      name: "Milk",
      unit: "cups"
    }
  ]
};