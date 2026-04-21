import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[var(--border-muted)] bg-[var(--panel)] p-6 shadow-[var(--shadow-soft)] sm:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top,var(--interactive-soft),transparent_62%)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="app-eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
