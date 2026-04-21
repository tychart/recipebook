import type { ReactNode } from "react";
import LoadingOverlay from "./LoadingOverlay";
import { cn } from "../lib/cn";

interface AuthFormProps {
  title: string;
  description?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  /** Full-screen pan overlay; omit to follow `isLoading` */
  showLoadingOverlay?: boolean;
  isSubmitDisabled: boolean;
  buttonText: string;
  loadingMessage: string;
  footer: ReactNode;
  children: ReactNode;
  containerClass?: string;
  formClass?: string;
}

const AuthForm = ({
  title,
  description,
  onSubmit,
  isLoading,
  showLoadingOverlay,
  isSubmitDisabled,
  buttonText,
  loadingMessage,
  footer,
  children,
  containerClass,
  formClass,
}: AuthFormProps) => {
  const overlayActive = showLoadingOverlay ?? isLoading;

  return (
    <div className={cn("app-panel relative overflow-hidden", containerClass)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,var(--interactive-soft),transparent_72%)]" />
      <form
        className={cn("relative space-y-6", formClass)}
        onSubmit={onSubmit}
        aria-busy={isLoading}
        {...(isLoading && { inert: true })}
      >
        <div>
          <p className="app-eyebrow">Account</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">{children}</div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="app-button app-button-primary w-full"
        >
          {isLoading ? "Loading..." : buttonText}
        </button>

        <div className="text-sm leading-6 text-[var(--text-secondary)]">{footer}</div>
      </form>

      <LoadingOverlay isLoading={overlayActive} message={loadingMessage} />
    </div>
  );
};

export default AuthForm;
