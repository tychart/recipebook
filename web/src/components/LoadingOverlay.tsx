/**
 * Shared loading overlay with spinner. Used by Login, Register, and other
 * forms that show a loading state. Announces the message to screen readers.
 */
interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Message announced to screen readers (e.g. "Logging in, please wait") */
  message: string;
}

export default function LoadingOverlay({ isLoading, message }: LoadingOverlayProps) {
  return (
    <div
      className="loading-overlay"
      style={{ display: isLoading ? "flex" : "none" }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{message}</span>
    </div>
  );
}
