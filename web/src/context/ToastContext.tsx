import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";
import "../style/Toast.css";

type ToastItem = { id: number; message: string };

const ToastContext = createContext<{
  showError: (message: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [exiting, setExiting] = useState(false);

  const dismissToast = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setToast(null);
      setExiting(false);
      return;
    }
    setExiting((already) => (already ? already : true));
  }, []);

  const showError = useCallback((message: string) => {
    const trimmed = message.trim() || "Something went wrong.";
    setExiting(false);
    setToast({ id: Date.now(), message: trimmed });
  }, []);

  useEffect(() => {
    if (!toast || exiting) return;
    const timer = window.setTimeout(() => dismissToast(), 6500);
    return () => window.clearTimeout(timer);
  }, [toast, exiting, dismissToast]);

  const handleToastAnimationEnd = (
    event: AnimationEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== "toast-out") return;
    setToast(null);
    setExiting(false);
  };

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {toast ? (
        <div className="toast-host" aria-live="assertive" role="alert">
          <div
            className={`toast toast--error ${exiting ? "toast--exit" : "toast--enter"}`}
            onAnimationEnd={handleToastAnimationEnd}
          >
            <p className="toast-message">{toast.message}</p>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss"
              onClick={dismissToast}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
