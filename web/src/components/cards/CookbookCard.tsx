import { Link } from "react-router-dom";
import type { Cookbook } from "../../../types/recipe";

interface CookbookCardProps {
  cookbook: Cookbook;
}

const colors = [
  "bg-red-100",
  "bg-red-200",
  "bg-red-300",
  "bg-pink-100",
  "bg-pink-200",
  "bg-pink-300",
];

export const CookbookCard = ({ cookbook }: CookbookCardProps) => {
  // Randomly pick a background color from the palette
  const bgColor = colors[cookbook.book_id % colors.length];

  return (
    <Link
      to={`/cookbook/${cookbook.book_id}`}
      className={`flex items-center justify-center aspect-square rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all ${bgColor}`}
    >
      <h2 className="text-center font-semibold text-lg text-red-900 p-2">
        {cookbook.book_name}
      </h2>
    </Link>
  );
};