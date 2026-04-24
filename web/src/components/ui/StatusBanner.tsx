import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type StatusBannerProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
};

const toneClasses: Record<NonNullable<StatusBannerProps["tone"]>, string> = {
  info: "app-status-info",
  success: "app-status-success",
  warning: "app-status-warning",
  danger: "app-status-danger",
};

export function StatusBanner({
  tone = "info",
  children,
  className,
  ...props
}: StatusBannerProps) {
  return (
    <div
      className={cn("app-status-surface", toneClasses[tone], className)}
      {...props}
    >
      {children}
    </div>
  );
}
