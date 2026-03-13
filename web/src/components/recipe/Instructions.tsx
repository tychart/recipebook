import type { InstructionInput } from "../../../types/types";

interface InstructionsProps {
  instructions: InstructionInput[];
}

export default function Instructions({ instructions }: InstructionsProps) {
  if (!instructions || instructions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold mb-2">Instructions</h2>
      {instructions.map((inst, index) => (
        <div key={index} className="flex gap-2 items-start">
          {/* Step Number */}
          <span className="w-6 text-right text-stone-700 select-none">{inst.instruction_number}.</span>

          {/* Instruction Text */}
          <span className="flex-1 text-stone-800">{inst.instruction_text}</span>
        </div>
      ))}
    </div>
  );
}