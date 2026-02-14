import { Link, Outlet } from 'react-router-dom';

/**
 * Shared layout wrapper for the app. Renders a top navigation bar (RecipeBook
 * logo, Cookbooks, Search, Add recipe) and an outlet where the current route's
 * page content is rendered.
 */
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <Link to="/" className="font-semibold text-lg">
            RecipeBook
          </Link>
          <Link to="/cookbooks" className="text-gray-600 dark:text-gray-300 hover:underline">
            Cookbooks
          </Link>
          <Link to="/search" className="text-gray-600 dark:text-gray-300 hover:underline">
            Search
          </Link>
          <Link to="/recipe/new" className="text-gray-600 dark:text-gray-300 hover:underline">
            Add recipe
          </Link>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
