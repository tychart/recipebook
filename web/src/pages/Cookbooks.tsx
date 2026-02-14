import { Link } from 'react-router-dom';

/**
 * Lists all cookbooks. Shows a heading, a "New cookbook" button that links to
 * the create form, and placeholder text for the cookbook list.
 */
export default function Cookbooks() {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cookbooks</h1>
        <Link
          to="/cookbooks/new"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white text-gray-900 border border-gray-300 hover:bg-gray-100"
        >
          New cookbook
        </Link>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        Your cookbooks will appear here. Create one to get started.
      </p>
    </div>
  );
}
