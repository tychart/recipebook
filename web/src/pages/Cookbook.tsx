import { Link, useParams } from "react-router-dom";
import { mockCookbookWithRecipes } from "../mocks/mockCookbook";
import { RecipeCard } from "../components/cards/RecipeCard"; // adjust path if needed

/**
 * Single cookbook view. Shows the cookbook title, an "Add recipe"
 * button, and a grid of recipe cards.
 */
export default function Cookbook() {
  const { id } = useParams<{ id: string }>();
  const cookbook = mockCookbookWithRecipes; // TODO: replace with real API call using id

  return (
    <div className="py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{cookbook.book_name}</h1>
        <Link
          to={`/cookbook/${id}/recipe/new`}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Add recipe
        </Link>
      </div>

      {/* Recipe grid */}
      {cookbook.recipes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {cookbook.recipes.map((recipe) => (
            <RecipeCard key={recipe.recipe_id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No recipes in this cookbook yet.</p>
      )}
    </div>
  );
}