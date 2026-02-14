import { Link, useParams } from 'react-router-dom';

/**
 * Single cookbook view. Shows the cookbook title (from route id), an "Add recipe"
 * link for this cookbook, and placeholder content for the recipe list.
 */
export default function Cookbook() {
  /** Cookbook id from the URL path (e.g. /cookbook/:id). */
  const { id } = useParams<{ id: string }>();

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cookbook {id}</h1>
        <Link
          to={`/cookbook/${id}/recipe/new`}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Add recipe
        </Link>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        Recipes in this cookbook will appear here.
      </p>
    </div>
  );
}
