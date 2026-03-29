import { Link } from "react-router-dom";
import type { Recipe } from "../../../types/types";
import { useBorderTheme } from "../../context/BorderThemeContext";
import {
  cardBorderClasses,
  cardTitleTextClasses,
  recipeCardBgClasses,
} from "../../theme/borderTheme";

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const { borderTheme } = useBorderTheme();

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className={`flex flex-col justify-center items-center aspect-[4/5] rounded-xl border shadow-md hover:shadow-xl transition-all hover:-translate-y-1 hover:-rotate-[5deg] p-4 ${cardBorderClasses[borderTheme]} ${recipeCardBgClasses[borderTheme]}`}
    >
      <h3 className={`text-center font-semibold text-lg ${cardTitleTextClasses[borderTheme]}`}>
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
};

export { RecipeCard };