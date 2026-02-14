import { Link } from 'react-router-dom';

/**
 * Landing page for RecipeBook. Shows the app title, tagline, and links to
 * cookbooks, search, and add recipe.
 */
export default function Home() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold mb-2">RecipeBook</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xl">
        Save and share recipes with family and friends. Never lose a recipe again.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/cookbooks"
          className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white text-gray-900 border border-gray-300 hover:bg-gray-100"
        >
          My cookbooks
        </Link>
        <Link
          to="/search"
          className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 hover:bg-gray-100"
        >
          Search recipes
        </Link>
        <Link
          to="/recipe/new"
          className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 hover:bg-gray-100"
        >
          Add recipe
        </Link>
      </div>
    </div>
  );
}
