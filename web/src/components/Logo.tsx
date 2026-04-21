import { cn } from "../lib/cn";

export default function Logo({
  size = "large",
  withTagline = false,
}: {
  size?: "large" | "medium";
  withTagline?: boolean;
}) {
  return (
    <div className="inline-flex flex-col items-start">
      <span className="app-eyebrow mb-2">Self-hosted recipe library</span>
      <span
        className={cn(
          "font-[var(--font-display)] font-semibold tracking-tight text-[var(--text-primary)]",
          size === "large" ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl",
        )}
      >
        Recipe<span className="text-[var(--accent-600)]">Book</span>
      </span>
      {withTagline ? (
        <span className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Organize recipes, share cookbooks, and keep family favorites close at hand.
        </span>
      ) : null}
    </div>
  );
}
