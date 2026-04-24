import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

type ExpandableSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
};

export function ExpandableSection({
  title,
  description,
  children,
  defaultOpen = false,
  className,
  contentClassName,
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </p>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-muted)] bg-[var(--surface)] text-[var(--text-muted)]">
          <ChevronDown
            className={cn("size-4 transition-transform", isOpen && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {isOpen ? (
        <div
          id={contentId}
          className={cn(
            "mt-5 border-t border-[var(--border-muted)] pt-5",
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
