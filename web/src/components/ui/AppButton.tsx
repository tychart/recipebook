import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClasses: Record<NonNullable<AppButtonProps["variant"]>, string> = {
  primary:
    "app-button app-button-primary",
  secondary:
    "app-button app-button-secondary",
  ghost:
    "app-button app-button-ghost",
  danger:
    "app-button app-button-danger",
};

export function AppButton({
  children,
  className,
  type = "button",
  variant = "secondary",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
