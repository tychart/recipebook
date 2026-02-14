import { Link, useParams } from 'react-router-dom';

/**
 * Page for editing an existing recipe. Placeholder for the form (title,
 * ingredients, steps, notes). Includes a link back to the recipe view.
 */
export default function RecipeEdit() {
  /** Recipe id from the URL path (e.g. /recipe/:id/edit). */
  const { id } = useParams<{ id: string }>();

  return (
    <div className="py-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Edit recipe</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Form for editing recipe {id} (title, ingredients, steps, notes) will go here.
      </p>
      <div className="flex gap-3">
        <Link
          to={`/recipe/${id}`}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Back to recipe
        </Link>
      </div>
    </div>
  );
}
