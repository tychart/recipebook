import { Fragment, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Recipe } from "../../../types/types";
import { useBorderTheme } from "../../context/BorderThemeContext";
import { recipeCardAccentLineHex } from "../../theme/borderTheme";
import "./RecipeCard.css";

function descriptionLines(description: string | undefined): string[] {
  if (!description?.trim()) {
    return ["—"];
  }
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return ["—"];
  }
  return lines.slice(0, 20);
}

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const { borderTheme } = useBorderTheme();
  const lines = descriptionLines(recipe.description);

  const style = {
    "--recipe-accent": recipeCardAccentLineHex[borderTheme],
  } as CSSProperties;

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-index-card group" style={style}>
      <div className="recipe-index-card__title">
        <h3 className="recipe-index-card__text-title">{recipe.name}</h3>
      </div>
      {recipe.image_url ? (
        <div className="recipe-index-card__thumb">
          <img src={recipe.image_url} alt={recipe.name} />
        </div>
      ) : null}
      <div className="recipe-index-card__accent" aria-hidden />
      <div className="recipe-index-card__body">
        {lines.map((text, i) => (
          <Fragment key={`${recipe.id}-line-${i}`}>
            <div className="recipe-index-card__row">
              <span className="recipe-index-card__text">{text}</span>
            </div>
            {i < lines.length - 1 ? (
              <div className="recipe-index-card__blueline" aria-hidden />
            ) : null}
          </Fragment>
        ))}
      </div>
    </Link>
  );
};

export { RecipeCard };
