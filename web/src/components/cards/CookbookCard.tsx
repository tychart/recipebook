import { Link } from "react-router-dom";
import type { Cookbook } from "../../../types/types";
import { useBorderTheme } from "../../context/BorderThemeContext";
import {
  cardBorderClasses,
  cardTitleTextClasses,
  cookbookCardBgClasses,
} from "../../theme/borderTheme";

interface CookbookCardProps {
  cookbook: Cookbook;
}

export const CookbookCard = ({ cookbook }: CookbookCardProps) => {
  const { borderTheme } = useBorderTheme();
  const palette = cookbookCardBgClasses[borderTheme];
  const bgColor = palette[cookbook.id % palette.length];
  const borderClass = cardBorderClasses[borderTheme];
  const titleClass = cardTitleTextClasses[borderTheme];

  return (
    <Link
      to={`/cookbook/${cookbook.id}`}
      className={`flex items-center justify-center aspect-[4/5] rounded-xl border shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 hover:-rotate-[5deg] ${borderClass} ${bgColor}`}
    >
      <h2 className={`text-center font-semibold text-lg p-2 ${titleClass}`}>
        {cookbook.name}
      </h2>
    </Link>
  );
};