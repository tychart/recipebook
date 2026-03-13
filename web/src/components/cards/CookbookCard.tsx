import { Link } from "react-router-dom";
import type { Cookbook } from "../../../types/types";

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
  const bgColor = colors[cookbook.id % colors.length];

  return (
    <Link
      to={`/cookbook/${cookbook.id}`}
      className={`flex items-center justify-center aspect-[4/5] rounded-xl border border-black shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 hover:-rotate-[5deg] ${bgColor}`}
    >
      <h2 className="text-center font-semibold text-lg text-red-900 p-2">
        {cookbook.name}
      </h2>
    </Link>
  );
};