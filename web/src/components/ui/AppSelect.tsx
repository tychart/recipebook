import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type AppSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
};

type DropdownPosition = {
  left: number;
  width: number;
  maxHeight: number;
  top: number;
  anchorTop: number;
  anchorBottom: number;
  direction: "up" | "down";
  ready: boolean;
};

function getEnabledOptions(options: AppSelectOption[]) {
  return options.filter((option) => !option.disabled);
}

function getInitialHighlightedIndex(
  enabledOptions: AppSelectOption[],
  value: string,
) {
  const selectedEnabledIndex = enabledOptions.findIndex(
    (option) => option.value === value,
  );
  return selectedEnabledIndex >= 0 ? selectedEnabledIndex : 0;
}

function getViewportMetrics() {
  const visualViewport = window.visualViewport;
  return {
    left: visualViewport?.offsetLeft ?? 0,
    top: visualViewport?.offsetTop ?? 0,
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
  };
}

function getDocumentHeight() {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.clientHeight,
  );
}

function resolveDropdownTop(
  position: Pick<DropdownPosition, "anchorTop" | "anchorBottom" | "direction" | "maxHeight">,
  menuHeight: number,
) {
  const viewport = getViewportMetrics();
  const minTop = window.scrollY + viewport.top + 16;

  if (position.direction === "up") {
    return Math.max(
      minTop,
      position.anchorTop - Math.min(menuHeight, position.maxHeight) - 8,
    );
  }

  return position.anchorBottom + 8;
}

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  id,
  ariaLabel,
  className,
}: AppSelectProps) {
  const fallbackId = useId();
  const selectId = id ?? fallbackId;
  const listboxId = `${selectId}-listbox`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  const enabledOptions = useMemo(() => getEnabledOptions(options), [options]);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const updateDropdownPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const viewport = getViewportMetrics();
      const spaceBelow = viewport.height - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const shouldOpenUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(288, shouldOpenUpward ? spaceAbove : spaceBelow));
      const anchorTop = window.scrollY + rect.top;
      const anchorBottom = window.scrollY + rect.bottom;
      const direction = shouldOpenUpward ? "up" : "down";
      const measuredMenuHeight = menuRef.current?.scrollHeight ?? maxHeight;
      const top = resolveDropdownTop(
        {
          anchorTop,
          anchorBottom,
          direction,
          maxHeight,
        },
        measuredMenuHeight,
      );

      setDropdownPosition({
        left: window.scrollX + rect.left,
        width: rect.width,
        maxHeight,
        top,
        anchorTop,
        anchorBottom,
        direction,
        ready: Boolean(menuRef.current),
      });
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.visualViewport?.addEventListener("resize", updateDropdownPosition);
    window.visualViewport?.addEventListener("scroll", updateDropdownPosition);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.visualViewport?.removeEventListener("resize", updateDropdownPosition);
      window.visualViewport?.removeEventListener("scroll", updateDropdownPosition);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !dropdownPosition || !menuRef.current) {
      return;
    }

    const measuredMenuHeight = menuRef.current.scrollHeight;
    const nextTop = resolveDropdownTop(dropdownPosition, measuredMenuHeight);

    setDropdownPosition((current) => {
      if (!current) {
        return current;
      }

      if (current.top === nextTop && current.ready) {
        return current;
      }

      return {
        ...current,
        top: nextTop,
        ready: true,
      };
    });
  }, [dropdownPosition, open, options.length]);

  const commitSelection = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const openMenu = () => {
    if (disabled || enabledOptions.length === 0) {
      return;
    }

    setHighlightedIndex(getInitialHighlightedIndex(enabledOptions, value));
    setOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement | HTMLUListElement>) => {
    if (disabled || enabledOptions.length === 0) {
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      openMenu();
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current < enabledOptions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current > 0 ? current - 1 : enabledOptions.length - 1,
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(enabledOptions.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const nextOption = enabledOptions[highlightedIndex] ?? enabledOptions[0];
      if (nextOption) {
        commitSelection(nextOption.value);
      }
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={selectId}
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "flex min-h-[3.125rem] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition outline-none",
          "bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] text-[var(--text-primary)]",
          "border-[var(--border-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
          "focus:border-[var(--interactive-border)] focus:shadow-[0_0_0_4px_var(--focus-ring)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-[var(--interactive-border)] shadow-[0_0_0_4px_var(--focus-ring)]",
        )}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          openMenu();
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && dropdownPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none absolute left-0 top-0 z-[120] w-full"
              style={{
                height: getDocumentHeight(),
              }}
            >
              <ul
                id={listboxId}
                ref={menuRef}
                role="listbox"
                aria-labelledby={selectId}
                tabIndex={-1}
                className="pointer-events-auto absolute overflow-y-auto rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface)] p-2 shadow-[var(--shadow-soft)] backdrop-blur-xl"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  maxHeight: dropdownPosition.maxHeight,
                  visibility: dropdownPosition.ready ? "visible" : "hidden",
                }}
                onKeyDown={handleKeyDown}
              >
                {options.map((option) => {
                  const enabledIndex = enabledOptions.findIndex(
                    (enabledOption) => enabledOption.value === option.value,
                  );
                  const isSelected = option.value === value;
                  const isHighlighted = enabledIndex >= 0 && enabledIndex === highlightedIndex;

                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-[1rem] px-3 py-2.5 text-sm transition",
                        option.disabled
                          ? "cursor-not-allowed opacity-45"
                          : isHighlighted
                            ? "bg-[var(--interactive-soft)] text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
                        isSelected && "text-[var(--text-primary)]",
                      )}
                      onMouseEnter={() => {
                        if (enabledIndex >= 0) {
                          setHighlightedIndex(enabledIndex);
                        }
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (!option.disabled) {
                          commitSelection(option.value);
                        }
                      }}
                    >
                      <span>{option.label}</span>
                      {isSelected ? (
                        <Check
                          className="size-4 shrink-0 text-[var(--interactive-accent-500)]"
                          aria-hidden
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
