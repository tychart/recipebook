import { Link } from "react-router-dom";
import type { Recipe } from "../../../types/types";

const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
  <Link
    to={`/recipe/${recipe.id}`}
    className="flex flex-col justify-center items-center aspect-[4/5] rounded-xl border border-black shadow-md hover:shadow-xl transition-all hover:-translate-y-1 hover:-rotate-[5deg] bg-red-100 p-4"
  >
    <h3 className="text-center font-semibold text-lg text-red-900">
      {recipe.name}
    </h3>

    {recipe.image_url && (
      <img
        src={recipe.image_url}
        alt={recipe.name}
        className="w-full h-24 object-cover rounded-md mt-2"
      />
    )}
  </Link>
);

export { RecipeCard };