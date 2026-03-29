import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BorderThemeProvider } from "../../../context/BorderThemeContext";
import { CookbookCard } from "../../cards/CookbookCard";
import type { Cookbook } from "../../../../../shared/types/recipe";

const mockCookbook: Cookbook = {
  book_id: 42,
  book_name: "Test Cookbook",
  owner_id: 1,
  created_dttm: "2025-01-01T00:00:00Z",
  categories: "Main",
};

describe("CookbookCard", () => {
  it("renders cookbook name", () => {
    render(
      <MemoryRouter>
        <BorderThemeProvider>
          <CookbookCard cookbook={mockCookbook} />
        </BorderThemeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Test Cookbook/i })).toBeInTheDocument();
  });

  it("links to the cookbook page", () => {
    render(
      <MemoryRouter>
        <BorderThemeProvider>
          <CookbookCard cookbook={mockCookbook} />
        </BorderThemeProvider>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /Test Cookbook/i });
    expect(link).toHaveAttribute("href", "/cookbook/42");
  });
});
