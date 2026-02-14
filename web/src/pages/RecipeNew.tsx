import { Link, useParams } from 'react-router-dom';

/**
 * Page for adding a new recipe. Placeholder for the form (title, ingredients,
 * steps, notes). When opened from a cookbook (e.g. /cookbook/:cookbookId/recipe/new),
 * cookbookId is shown; Cancel then returns to that cookbook, otherwise to the
 * cookbooks list.
 */
export default function RecipeNew() {
  /** Optional cookbook id when adding a recipe from a specific cookbook. */
  const { cookbookId } = useParams<{ cookbookId?: string }>();

  return (
    <div className="py-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Add recipe</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Form for adding a recipe (title, ingredients, steps, notes) will go here.
        {cookbookId && (
          <span className="block mt-2">Adding to cookbook: {cookbookId}</span>
        )}
      </p>
      <div className="flex gap-3">
        <Link
          to={cookbookId ? `/cookbook/${cookbookId}` : '/cookbooks'}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 hover:bg-gray-100"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
