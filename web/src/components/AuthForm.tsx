import type { ReactNode } from "react";
import LoadingOverlay from "./LoadingOverlay";

interface AuthFormProps {
  title: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isSubmitDisabled: boolean;
  buttonText: string;
  loadingMessage: string;
  footer: ReactNode;
  children: ReactNode;
  containerClass: string;
  formClass: string;
}

const AuthForm = ({
  title,
  onSubmit,
  isLoading,
  isSubmitDisabled,
  buttonText,
  loadingMessage,
  footer,
  children,
  containerClass,
  formClass,
}: AuthFormProps) => {
  return (
    <div className={containerClass}>
      <form
        className={formClass}
        onSubmit={onSubmit}
        aria-busy={isLoading}
        {...(isLoading && { inert: true })}
      >
        <h2>{title}</h2>

        <div className="form-inputs">{children}</div>

        <button type="submit" disabled={isSubmitDisabled}>
          {isLoading ? "Loading..." : buttonText}
        </button>

        {footer}
      </form>

      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
    </div>
  );
};

export default AuthForm;