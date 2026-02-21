import { Link } from "react-router-dom";
import type { Recipe } from "../../../../shared/types/recipe";

const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
  <Link
    to={`/recipe/${recipe.recipe_id}`}
    className="flex flex-col justify-center items-center aspect-square rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all bg-red-100 p-4"
  >
    <h3 className="text-center font-semibold text-lg text-red-900">{recipe.recipe_name}</h3>
    {recipe.recipe_image_url && (
      <img
        src={recipe.recipe_image_url}
        alt={recipe.recipe_name}
        className="w-full h-24 object-cover rounded-md mt-2"
      />
    )}
  </Link>
);

export { RecipeCard };