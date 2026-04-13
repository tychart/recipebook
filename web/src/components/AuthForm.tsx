import type { ReactNode } from "react";
import LoadingOverlay from "./LoadingOverlay";

interface AuthFormProps {
  title: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  /** Full-screen pan overlay; omit to follow `isLoading` */
  showLoadingOverlay?: boolean;
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

      <LoadingOverlay isLoading={overlayActive} message={loadingMessage} />
    </div>
  );
};

export default AuthForm;