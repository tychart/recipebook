import { Link } from "react-router-dom";
import {
  mockCookbookWithRecipes,
  type CookbookWithRecipes,
} from "../mocks/mockCookbook";
import { CookbookCard } from "../components/cards/CookbookCard";

// multiple mock cookbooks for testing
const mockCookbooks: CookbookWithRecipes[] = [
  mockCookbookWithRecipes,
  { ...mockCookbookWithRecipes, book_id: 2, book_name: "Desserts Galore", categories: "Dessert" },
  { ...mockCookbookWithRecipes, book_id: 3, book_name: "Savory Dishes", categories: "Main" },
  { ...mockCookbookWithRecipes, book_id: 4, book_name: "Healthy Eats", categories: "Healthy" },
];

export default function Cookbooks() {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cookbooks</h1>
        <Link
          to="/cookbooks/new"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white text-gray-900 hover:bg-gray-100 transition"
        >
          New cookbook
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockCookbooks.map((book) => (
          <CookbookCard key={book.book_id} cookbook={book} />
        ))}
      </div>
    </div>
  );
}