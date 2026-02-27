import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../../pages/Home";

describe("Home", () => {
  it("renders RecipeBook title and tagline", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /RecipeBook/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Save and share recipes with family and friends/i),
    ).toBeInTheDocument();
  });

  it("renders links to cookbooks, search, and add recipe", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /My cookbooks/i })).toHaveAttribute("href", "/cookbooks");
    expect(screen.getByRole("link", { name: /Search recipes/i })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: /Add recipe/i })).toHaveAttribute("href", "/recipe/new");
  });
});
