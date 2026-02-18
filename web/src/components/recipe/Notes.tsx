import type { Recipe } from "../../../../shared/types/recipe";

interface NotesProps {
    notes: Recipe["notes"]
}

export default function Notes({ notes }: NotesProps) {
  if (!notes) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Notes</h2>
      <p>{notes}</p>
    </div>
  );
}
