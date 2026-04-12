import type { Recipe } from "../../../types/types";

interface NotesProps {
    notes: Recipe["notes"]
}

export default function Notes({ notes }: NotesProps) {
  if (!notes) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Notes</h2>
      <p className="text-stone-700 whitespace-pre-wrap">
        {notes}
      </p>
    </div>
  );
}
