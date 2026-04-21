import type { Recipe } from "../../../types/types";

interface InstructionsProps {
  instructions: Recipe["instructions"];
}

export default function Instructions({ instructions }: InstructionsProps) {
  const steps = instructions
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <div>
      <h2 className="font-[var(--font-display)] text-2xl font-semibold mb-4 text-[var(--text-primary)]">
        Instructions
      </h2>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li
            key={index}
            className="flex gap-4 rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--text-secondary)]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--text-primary)]">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
