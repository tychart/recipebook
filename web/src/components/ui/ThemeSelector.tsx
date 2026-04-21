import { useTheme, type ThemeMode } from "../../context/ThemeContext";
import { cn } from "../../lib/cn";

const options: Array<{ value: ThemeMode; label: string; description: string }> = [
  { value: "system", label: "System", description: "Match the device or browser theme." },
  { value: "light", label: "Light", description: "Warm, bright surfaces tuned for reading." },
  { value: "dark", label: "Dark", description: "Low-glare night mode with strong contrast." },
];

export function ThemeSelector() {
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const isActive = themeMode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setThemeMode(option.value)}
            className={cn(
              "flex min-h-28 flex-col items-start rounded-[1.5rem] border p-4 text-left transition",
              isActive
                ? "border-[var(--interactive-border)] bg-[var(--interactive-soft)] shadow-[var(--shadow-soft)]"
                : "border-[var(--border-muted)] bg-[var(--surface-muted)] hover:border-[var(--interactive-border)] hover:bg-[var(--surface-soft)]",
            )}
          >
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {option.label}
            </span>
            <span className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {option.description}
            </span>
            {option.value === "system" ? (
              <span className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Currently {resolvedTheme}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
