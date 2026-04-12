import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Cookbook } from "../../../types/types";
import { useBorderTheme } from "../../context/BorderThemeContext";
import type { BorderThemeId } from "../../theme/borderTheme";
import "./CookbookCard.css";

interface CookbookCardProps {
  cookbook: Cookbook;
}

/** Light cover tint per page-border theme (no external cover art). */
const BOOK_FACE: Record<BorderThemeId, string> = {
  red: "#fecdd3",
  blue: "#bfdbfe",
  green: "#bbf7d0",
  yellow: "#fef08a",
  purple: "#e9d5ff",
  pink: "#fbcfe8",
};

/** Dark text on pastel covers */
function coverTitleClass(): string {
  return "text-stone-800 [text-shadow:0_1px_0_rgba(255,255,255,0.35)]";
}

export const CookbookCard = ({ cookbook }: CookbookCardProps) => {
  const { borderTheme } = useBorderTheme();

  const bookStyle = {
    "--book-face": BOOK_FACE[borderTheme],
  } as CSSProperties;

  return (
    <Link
      to={`/cookbook/${cookbook.id}`}
      className="book group w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2"
      style={bookStyle}
    >
      <div className="book-pages" aria-hidden />
      <div className="book-cover">
        <div className="book-spine-effect" aria-hidden />
        <div className="book-light" aria-hidden />
        <h2 className={`book-cover__title ${coverTitleClass()}`}>{cookbook.name}</h2>
      </div>
    </Link>
  );
};
