import { Link } from 'react-router-dom';

/**
 * Page for creating a new cookbook. Placeholder for the form (name,
 * private/shared). Includes a link back to the cookbooks list.
 */
export default function CookbookNew() {
  return (
    <div className="py-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">New cookbook</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Form for creating a cookbook (name, private/shared) will go here.
      </p>
      <div className="flex gap-3">
        <Link
          to="/cookbooks"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 hover:bg-gray-100"
        >
          Back to cookbooks
        </Link>
      </div>
    </div>
  );
}
