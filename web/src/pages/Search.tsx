/**
 * Search page. Renders a search input for querying recipes by name, ingredients,
 * or instructions, and placeholder area for results.
 */
export default function Search() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold mb-6">Search recipes</h1>
      <p className="text-gray-500 mb-4">
        Search by recipe name, ingredients, or instructions.
      </p>
      <input
        type="search"
        placeholder="Search..."
        className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        aria-label="Search recipes"
      />
      <p className="text-sm text-gray-500 mt-4">
        Results will appear here.
      </p>
    </div>
  );
}
