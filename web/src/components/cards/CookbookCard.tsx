import { Link } from "react-router-dom";
import type { Cookbook } from "../../../types/types";
import { useBorderTheme } from "../../context/BorderThemeContext";

interface CookbookCardProps {
  cookbook: Cookbook;
}

const paletteClasses = {
  red: "from-rose-200/90 via-orange-100/90 to-white/80 dark:from-rose-950/60 dark:via-orange-950/50 dark:to-stone-950/60",
  blue: "from-sky-200/90 via-cyan-100/90 to-white/80 dark:from-sky-950/60 dark:via-cyan-950/50 dark:to-stone-950/60",
  green: "from-emerald-200/90 via-lime-100/90 to-white/80 dark:from-emerald-950/60 dark:via-lime-950/50 dark:to-stone-950/60",
  yellow: "from-amber-200/90 via-yellow-100/90 to-white/80 dark:from-amber-950/60 dark:via-yellow-950/50 dark:to-stone-950/60",
  purple: "from-violet-200/90 via-fuchsia-100/90 to-white/80 dark:from-violet-950/60 dark:via-fuchsia-950/50 dark:to-stone-950/60",
  pink: "from-pink-200/90 via-rose-100/90 to-white/80 dark:from-pink-950/60 dark:via-rose-950/50 dark:to-stone-950/60",
} as const;

export const CookbookCard = ({ cookbook }: CookbookCardProps) => {
  const { borderTheme } = useBorderTheme();

  return (
    <Link
      to={`/cookbook/${cookbook.id}`}
      className="group relative overflow-hidden rounded-[1.9rem] border border-[var(--border-muted)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-soft)] focus:outline-none"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${paletteClasses[borderTheme]}`} aria-hidden />
      <div className="absolute inset-y-5 left-5 w-4 rounded-full bg-[color:rgba(38,24,17,0.12)] blur-[1px]" aria-hidden />
      <div className="absolute inset-x-5 top-5 h-px bg-white/50" aria-hidden />
      <div className="relative min-h-48 rounded-[1.5rem] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.46),rgba(255,255,255,0.14))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Cookbook
        </p>
        <h2 className="mt-6 font-[var(--font-display)] text-3xl font-semibold leading-tight text-[var(--text-primary)]">
          {cookbook.name}
        </h2>
        <div className="mt-8 flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>{cookbook.categories?.length ?? 0} categories</span>
          <span className="app-tag">{cookbook.current_user_role ?? "shared"}</span>
        </div>
      </div>
    </Link>
  );
};
