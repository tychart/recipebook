import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type AppModalProps = {
  children: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  panelClassName?: string;
  overlayClassName?: string;
};

export function AppModal({
  children,
  onClose,
  labelledBy,
  panelClassName = "",
  overlayClassName = "",
}: AppModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const currentModalCount = Number(document.body.dataset.modalOpenCount ?? "0");
    const previousOverflow = document.body.style.overflow;

    document.body.dataset.modalOpenCount = String(currentModalCount + 1);
    if (currentModalCount === 0) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      const remainingModalCount = Math.max(
        0,
        Number(document.body.dataset.modalOpenCount ?? "1") - 1,
      );

      if (remainingModalCount === 0) {
        delete document.body.dataset.modalOpenCount;
        document.body.style.overflow = previousOverflow;
      } else {
        document.body.dataset.modalOpenCount = String(remainingModalCount);
      }
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm ${overlayClassName}`.trim()}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`${panelClassName} max-h-[calc(100dvh-2rem)] overflow-y-auto`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
