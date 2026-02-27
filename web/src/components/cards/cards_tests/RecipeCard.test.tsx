import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecipeCard } from "../../cards/RecipeCard";
import type { Recipe } from "../../../../../shared/types/recipe";

const mockRecipe: Recipe = {
  recipe_id: 99,
  recipe_name: "Test Recipe",
  instructions: "Do the thing.",
  servings: 2,
  creator_id: 1,
  modified_dttm: "2025-01-01T00:00:00Z",
  category: "Main",
  book_id: 1,
  ingredients: [],
};

describe("RecipeCard", () => {
  it("renders recipe name", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Test Recipe/i })).toBeInTheDocument();
  });

  it("links to the recipe page", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /Test Recipe/i });
    expect(link).toHaveAttribute("href", "/recipe/99");
  });
});
