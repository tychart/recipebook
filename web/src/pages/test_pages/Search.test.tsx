import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Search from "../../pages/Search";

const searchRecipesMock = vi.fn();

vi.mock("../../api/search", () => ({
  searchRecipes: (...args: unknown[]) => searchRecipesMock(...args),
}));

describe("Search", () => {
  beforeEach(() => {
    searchRecipesMock.mockReset();
  });

  it("renders search heading and controls", () => {
    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Search recipes/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Search recipes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Results/i)).toHaveValue(10);
    expect(screen.getByRole("button", { name: /Search/i })).toBeDisabled();
  });

  it("submits the search query and renders result cards", async () => {
    searchRecipesMock.mockResolvedValue([
      {
        recipe_id: 12,
        recipe_name: "Brownies",
        cookbook_id: 3,
        cookbook_name: "Dessert Vault",
        image_url: "http://example.com/brownies.png",
        category: "Dessert",
        tags: ["sweet", "chocolate"],
        score: 0.98,
      },
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Search recipes/i), {
      target: { value: "fudgy chocolate brownies" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    await waitFor(() =>
      expect(searchRecipesMock).toHaveBeenCalledWith({
        query: "fudgy chocolate brownies",
        limit: 10,
      }),
    );

    expect(await screen.findByRole("link", { name: /Brownies/i })).toHaveAttribute(
      "href",
      "/recipe/12",
    );
    expect(screen.getByText("Dessert Vault")).toBeInTheDocument();
    expect(screen.getByText("sweet")).toBeInTheDocument();
    expect(screen.getByAltText("Brownies")).toHaveAttribute("src", "http://example.com/brownies.png");
  });

  it("shows an empty-state message when no results are returned", async () => {
    searchRecipesMock.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Search recipes/i), {
      target: { value: "savory tomato tart" },
    });
    fireEvent.change(screen.getByLabelText(/Results/i), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    await waitFor(() =>
      expect(searchRecipesMock).toHaveBeenCalledWith({
        query: "savory tomato tart",
        limit: 6,
      }),
    );

    expect(
      await screen.findByText(/No recipes matched that search/i),
    ).toBeInTheDocument();
  });

  it("shows an error message when the search request fails", async () => {
    searchRecipesMock.mockRejectedValue(new Error("boom"));

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Search recipes/i), {
      target: { value: "weeknight pasta" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Search failed/i);
  });

  it("submits on Enter but preserves newlines on Shift+Enter", async () => {
    searchRecipesMock.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/Search recipes/i);
    fireEvent.change(textarea, {
      target: { value: "weeknight curry" },
    });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

    await waitFor(() =>
      expect(searchRecipesMock).toHaveBeenCalledWith({
        query: "weeknight curry",
        limit: 10,
      }),
    );

    fireEvent.change(textarea, {
      target: { value: "weeknight curry" },
    });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: true });

    expect(searchRecipesMock).toHaveBeenCalledTimes(1);
  });
});
