import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Cookbook from "../../pages/Cookbook";

describe("Cookbook", () => {
  it("renders cookbook name and Add recipe link", () => {
    render(
      <MemoryRouter initialEntries={["/cookbook/1"]}>
        <Routes>
          <Route path="/cookbook/:id" element={<Cookbook />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /Jordan's Favorite Recipes/i }),
    ).toBeInTheDocument();
    const addLink = screen.getByRole("link", { name: /Add recipe/i });
    expect(addLink).toBeInTheDocument();
    expect(addLink).toHaveAttribute("href", "/cookbook/1/recipe/new");
  });

  it("renders recipe cards when cookbook has recipes", () => {
    render(
      <MemoryRouter initialEntries={["/cookbook/1"]}>
        <Routes>
          <Route path="/cookbook/:id" element={<Cookbook />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Classic Pancakes")).toBeInTheDocument();
  });
});
