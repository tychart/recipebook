import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Layout from "./Layout";

describe("Layout", () => {
  it("renders sidebar with app title and user name", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Page content</span>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /RecipeBook/i })).toBeInTheDocument();
    expect(screen.getByText("Jordan Brockbank")).toBeInTheDocument();
  });

  it("renders outlet content", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Page content</span>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
