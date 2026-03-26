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
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Instructions</h2>
      <ol className="list-decimal pl-6">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
