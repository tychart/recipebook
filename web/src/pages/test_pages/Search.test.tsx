import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Search from "../../pages/Search";

describe("Search", () => {
  it("renders Search recipes heading and description", () => {
    render(<Search />);
    expect(
      screen.getByRole("heading", { name: /Search recipes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Search by recipe name, ingredients, or instructions/i),
    ).toBeInTheDocument();
  });

  it("renders search input with correct placeholder and label", () => {
    render(<Search />);
    const input = screen.getByRole("searchbox", { name: /Search recipes/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search...");
  });

  it("shows results placeholder text", () => {
    render(<Search />);
    expect(screen.getByText(/Results will appear here/i)).toBeInTheDocument();
  });
});
