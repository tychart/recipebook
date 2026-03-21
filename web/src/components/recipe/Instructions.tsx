import type { Recipe } from "../../../types/types";

interface InstructionsProps {
  instructions: Recipe["instructions"];
}

export default function Instructions({ instructions }: InstructionsProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Instructions</h2>
      <p>{instructions}</p>
    </div>
  );
}
