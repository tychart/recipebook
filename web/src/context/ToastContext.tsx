/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";

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

  const handleToastAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== "toast-out") return;
    setToast(null);
    setExiting(false);
  };

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {toast ? (
        <div
          className="pointer-events-none fixed right-4 top-4 z-[10000] w-[min(calc(100vw-2rem),17rem)] max-w-[calc(100vw-3rem)]"
          aria-live="assertive"
          role="alert"
        >
          <div
            className={`pointer-events-auto flex flex-col gap-2 rounded-2xl border px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md app-status-danger ${
              exiting
                ? "toast-animate-out animate-[toast-out_0.28s_ease-out_forwards]"
                : "toast-animate-in animate-[toast-in_0.28s_ease-out]"
            }`}
            onAnimationEnd={handleToastAnimationEnd}
          >
            <p className="m-0 text-sm leading-6">{toast.message}</p>
            <button
              type="button"
              className="inline-flex self-end rounded-lg px-2 py-1 text-lg leading-none text-[var(--danger-text)] transition hover:bg-[color-mix(in_srgb,var(--text-inverse)_10%,transparent)] hover:text-[var(--text-inverse)]"
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
