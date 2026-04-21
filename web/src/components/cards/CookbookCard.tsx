import { Link } from "react-router-dom";
import type { Cookbook } from "../../../types/types";

interface CookbookCardProps {
  cookbook: Cookbook;
}

export const CookbookCard = ({ cookbook }: CookbookCardProps) => {
  return (
    <Link
      to={`/cookbook/${cookbook.id}`}
      className="app-card group flex min-h-56 flex-col justify-between overflow-hidden border-[var(--border-muted)] bg-[var(--surface)] p-6 hover:-translate-y-0.5 hover:border-[var(--interactive-border)] hover:shadow-[var(--shadow-soft)] focus:outline-none"
    >
      <div
        className="mb-6 h-1.5 w-14 rounded-full"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--interactive-accent-400) 74%, white 26%), color-mix(in srgb, var(--interactive-accent-500) 82%, white 18%))",
        }}
      />

      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Cookbook
        </p>
        <h2 className="mt-4 font-[var(--font-display)] text-[2rem] font-semibold leading-tight text-[var(--text-primary)]">
          {cookbook.name}
        </h2>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">
          {cookbook.categories?.length ?? 0} categories
        </span>
        <span
          className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
          style={{
            background:
              "color-mix(in srgb, var(--interactive-accent-400) 6%, transparent)",
            borderColor:
              "color-mix(in srgb, var(--interactive-accent-500) 12%, transparent)",
          }}
        >
          {cookbook.current_user_role ?? "shared"}
        </span>
      </div>
    </Link>
  );
};
