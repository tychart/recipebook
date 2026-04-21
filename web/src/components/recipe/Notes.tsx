import type { Recipe } from "../../../types/types";

interface NotesProps {
    notes: Recipe["notes"]
}

export default function Notes({ notes }: NotesProps) {
  if (!notes) return null;

  return (
    <div className="rounded-[1.75rem] border border-[var(--border-muted)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-[var(--font-display)] text-2xl font-semibold mb-3 text-[var(--text-primary)]">
        Notes
      </h2>
      <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
        {notes}
      </p>
    </div>
  );
}
