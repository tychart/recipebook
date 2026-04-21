import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type StatusBannerProps = {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
  className?: string;
};

const toneClasses: Record<NonNullable<StatusBannerProps["tone"]>, string> = {
  info: "border-[color:rgba(90,95,108,0.22)] bg-[var(--surface-muted)] text-[var(--text-secondary)]",
  success:
    "border-emerald-300/70 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  warning:
    "border-amber-300/70 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  danger:
    "border-rose-300/70 bg-rose-500/10 text-rose-800 dark:text-rose-200",
};

export function StatusBanner({
  tone = "info",
  children,
  className,
}: StatusBannerProps) {
  return (
    <div className={cn("rounded-2xl border px-5 py-4 text-sm", toneClasses[tone], className)}>
      {children}
    </div>
  );
}
