export const mockRecipe = {
  recipe_id: 1,
  recipe_name: "Classic Pancakes",
  servings: 4,
  instructions: `
1. Mix dry ingredients together.
2. Whisk in milk and eggs.
3. Heat skillet over medium heat.
4. Pour batter and cook until golden brown.
  `,
  notes: "Add blueberries or chocolate chips.",
  ingredients: [
    { ingredient_id: 1, amount: 2, name: "Cups Flour" },
    { ingredient_id: 2, amount: 2, name: "Eggs" },
    { ingredient_id: 3, amount: 1.5, name: "Cups Milk" }
  ]
};
