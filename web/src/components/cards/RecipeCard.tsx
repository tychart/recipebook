import { Link } from "react-router-dom";
import type { Recipe } from "../../../types/types";

function descriptionLines(description: string | undefined): string[] {
  if (!description?.trim()) {
    return ["—"];
  }
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return ["—"];
  }
  return lines.slice(0, 20);
}

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const lines = descriptionLines(recipe.description);

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="app-card group overflow-hidden"
    >
      {recipe.image_url ? (
        <div className="relative h-52 overflow-hidden bg-[var(--surface-muted)]">
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="flex h-52 items-center justify-center bg-[radial-gradient(circle_at_top,var(--accent-soft),transparent_60%)] px-6 text-center text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          No image
        </div>
      )}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              {recipe.category || "Recipe"}
            </p>
            <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold leading-tight text-[var(--text-primary)]">
              {recipe.name}
            </h3>
          </div>
          <span className="app-tag">{recipe.servings} servings</span>
        </div>

        <div className="mt-5 space-y-3">
          {lines.slice(0, 3).map((text, index) => (
            <p
              key={`${recipe.id}-line-${index}`}
              className="border-b border-[var(--border-muted)] pb-3 text-sm leading-6 text-[var(--text-secondary)] last:border-b-0 last:pb-0"
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </Link>
  );
};

export { RecipeCard };
