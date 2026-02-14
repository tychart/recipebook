import { Link, useParams } from 'react-router-dom';

/**
 * Single recipe view. Shows the recipe title (from route id), an "Edit" link,
 * and placeholder content for ingredients, steps, and notes.
 */
export default function Recipe() {
  /** Recipe id from the URL path (e.g. /recipe/:id). */
  const { id } = useParams<{ id: string }>();

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Recipe {id}</h1>
        <Link
          to={`/recipe/${id}/edit`}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 hover:bg-gray-100"
        >
          Edit
        </Link>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        Recipe details (ingredients, steps, notes) will go here.
      </p>
    </div>
  );
}
