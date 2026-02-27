import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RecipePage from "../RecipePage";

describe("RecipePage", () => {
  it("shows loading state initially", () => {
    render(
      <MemoryRouter initialEntries={["/recipe/1"]}>
        <Routes>
          <Route path="/recipe/:id" element={<RecipePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders recipe name and Edit link after loading", async () => {
    render(
      <MemoryRouter initialEntries={["/recipe/1"]}>
        <Routes>
          <Route path="/recipe/:id" element={<RecipePage />} />
        </Routes>
      </MemoryRouter>,
    );
    const heading = await screen.findByRole(
      "heading",
      { name: /Classic Pancakes/i },
      { timeout: 2000 },
    );
    expect(heading).toBeInTheDocument();
    const editLink = screen.getByRole("link", { name: /Edit/i });
    expect(editLink).toHaveAttribute("href", "/recipe/1/edit");
  });

  it("renders ingredients and instructions from mock recipe", async () => {
    render(
      <MemoryRouter initialEntries={["/recipe/1"]}>
        <Routes>
          <Route path="/recipe/:id" element={<RecipePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("Ingredients", {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Instructions")).toBeInTheDocument();
  });
});
