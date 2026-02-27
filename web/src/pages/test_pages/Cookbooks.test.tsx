import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Cookbooks from "../../pages/Cookbooks";

describe("Cookbooks", () => {
  it("renders Cookbooks heading and New cookbook link", () => {
    render(
      <MemoryRouter>
        <Cookbooks />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Cookbooks/i })).toBeInTheDocument();
    const newLink = screen.getByRole("link", { name: /New cookbook/i });
    expect(newLink).toBeInTheDocument();
    expect(newLink).toHaveAttribute("href", "/cookbooks/new");
  });

  it("renders cookbook cards with names from mock data", () => {
    render(
      <MemoryRouter>
        <Cookbooks />
      </MemoryRouter>,
    );
    expect(screen.getByText("Jordan's Favorite Recipes")).toBeInTheDocument();
    expect(screen.getByText("Desserts Galore")).toBeInTheDocument();
    expect(screen.getByText("Savory Dishes")).toBeInTheDocument();
    expect(screen.getByText("Healthy Eats")).toBeInTheDocument();
  });
});
