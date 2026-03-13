import { useState, useRef } from "react";
import type { Ingredient, RecipeInput, InstructionInput } from "../../../types/types";
import RecipeImage from "./RecipeImage";

interface RecipeFormProps {
  initialData: RecipeInput;
  onSubmit: (recipe: RecipeInput, imageFile?: File) => void;
  submitLabel?: string;
}

// Ref type for ingredient row
type IngredientRowRefs = {
  amount?: HTMLInputElement | null;
  unit?: HTMLInputElement | null;
  name?: HTMLInputElement | null;
};

export default function RecipeForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
}: RecipeFormProps) {
  const [recipe, setRecipe] = useState<RecipeInput>(initialData);
  const [selectedImageFile, setSelectedImageFile] = useState<File>();
  const [tagInput, setTagInput] = useState(initialData.tags?.join(", ") ?? "");

  // --- Refs for auto-focus ---
  const ingredientRefs = useRef<IngredientRowRefs[]>([]);
  const instructionRefs = useRef<HTMLInputElement[]>([]);

  // --- Generic Change Handler ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRecipe((prev) => ({
      ...prev,
      [name]: name === "servings" ? Number(value) : value,
    }));
  };

  // --- Ingredients Handlers ---
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    setRecipe((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  const handleAddIngredient = (focusIndex?: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { amount: 0, unit: "", name: "" }],
    }));

    // Focus after render
    setTimeout(() => {
      const idx = focusIndex ?? recipe.ingredients.length;
      ingredientRefs.current[idx]?.amount?.focus();
    }, 0);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  // --- Instructions Handlers ---
  const handleInstructionChange = (index: number, value: string) => {
    setRecipe((prev) => {
      const updated = [...(prev.instructions as InstructionInput[])];
      updated[index] = { ...updated[index], instruction_text: value, instruction_number: index + 1 };
      return { ...prev, instructions: updated };
    });
  };

  const handleAddInstruction = (focusIndex?: number) => {
    setRecipe((prev) => ({
      ...prev,
      instructions: [
        ...(prev.instructions as InstructionInput[]),
        { instruction_number: (prev.instructions?.length ?? 0) + 1, instruction_text: "" },
      ],
    }));

    setTimeout(() => {
      const idx = focusIndex ?? (recipe.instructions?.length ?? 0);
      instructionRefs.current[idx]?.focus();
    }, 0);
  };

  const handleRemoveInstruction = (index: number) => {
    setRecipe((prev) => {
      const updated = [...(prev.instructions as InstructionInput[])];
      updated.splice(index, 1);
      return {
        ...prev,
        instructions: updated.map((inst, i) => ({ ...inst, instruction_number: i + 1 })),
      };
    });
  };

  // --- Submit Handler ---
  const handleSubmit = () => {
    const parsedTags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    onSubmit({ ...recipe, tags: parsedTags }, selectedImageFile);
  };

  const categories = ["Main", "Dessert", "Appetizer", "Side", "Snack", "Drink"];

  return (
    <div className="py-10 max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-stone-200 space-y-8">

        {/* Recipe Image */}
        <RecipeImage
          imageUrl={recipe.image_url}
          editable
          alt={recipe.name || "Recipe Image"}
          onEditClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e: any) => {
              const file = e.target.files[0];
              if (file) {
                setSelectedImageFile(file);
                setRecipe((prev) => ({ ...prev, image_url: URL.createObjectURL(file) }));
              }
            };
            input.click();
          }}
          onRemoveClick={() => {
            setSelectedImageFile(undefined);
            setRecipe((prev) => ({ ...prev, image_url: "" }));
          }}
        />

        {/* Name, Description, Category, Tags, Servings */}
        <div>
          <label className="block mb-2 font-medium text-stone-700">Recipe Name</label>
          <input
            type="text"
            name="name"
            value={recipe.name}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-stone-700">Description</label>
          <textarea
            name="description"
            value={recipe.description ?? ""}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-stone-700">Category</label>
          <select
            name="category"
            value={recipe.category || ""}
            onChange={handleChange}
            className="w-48 p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          >
            <option value="" disabled>Select a category</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-stone-700">Tags (comma separated)</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. gluten-free, quick"
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-stone-700">Servings</label>
          <input
            type="number"
            name="servings"
            value={recipe.servings}
            onChange={handleChange}
            className="w-32 p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-800">Ingredients</h2>
            <button
              type="button"
              onClick={() => handleAddIngredient()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-black font-bold hover:bg-amber-600 transition"
            >
              +
            </button>
          </div>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-3 items-center w-full">

                {/* Amount */}
                <input
                  type="number"
                  value={ingredient.amount}
                  onChange={(e) => handleIngredientChange(index, "amount", Number(e.target.value))}
                  placeholder="Amount"
                  className="w-24 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                  ref={(el) => { ingredientRefs.current[index] = { ...ingredientRefs.current[index], amount: el }; }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIngredient(index + 1);
                      setTimeout(() => ingredientRefs.current[index + 1]?.amount?.focus(), 0);
                    }
                  }}
                />

                {/* Unit */}
                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                  placeholder="Unit"
                  className="w-28 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                  ref={(el) => { ingredientRefs.current[index] = { ...ingredientRefs.current[index], unit: el }; }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIngredient(index + 1);
                      setTimeout(() => ingredientRefs.current[index + 1]?.amount?.focus(), 0);
                    }
                  }}
                />

                {/* Name */}
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                  placeholder="Ingredient"
                  className="flex-1 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                  ref={(el) => { ingredientRefs.current[index] = { ...ingredientRefs.current[index], name: el }; }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIngredient(index + 1);
                      setTimeout(() => ingredientRefs.current[index + 1]?.amount?.focus(), 0);
                    }
                  }}
                />

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 text-lg rounded-full"
                >
                  ×
                </button>
              </div>
            ))}

            {recipe.ingredients.length === 0 && (
              <p className="text-stone-400 text-sm">Click + to add your first ingredient</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-800">Instructions</h2>
            <button
              type="button"
              onClick={() => handleAddInstruction()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-black font-bold hover:bg-amber-600 transition"
            >
              +
            </button>
          </div>

          <div className="space-y-3">
            {(recipe.instructions as InstructionInput[]).map((inst, index) => (
              <div key={index} className="flex gap-3 items-center w-full">
                <span className="w-6 text-right text-stone-700 select-none">{index + 1}.</span>
                <input
                  type="text"
                  value={inst.instruction_text}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  placeholder="Instruction"
                  className="flex-1 p-2 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
                  ref={(el) => { instructionRefs.current[index] = el!; }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddInstruction(index + 1);
                      setTimeout(() => instructionRefs.current[index + 1]?.focus(), 0);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveInstruction(index)}
                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 text-lg rounded-full"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-2 font-medium text-stone-700">Notes</label>
          <textarea
            name="notes"
            value={recipe.notes ?? ""}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-amber-500 text-black font-medium hover:bg-amber-600 transition shadow-sm"
          >
            {submitLabel}
          </button>
        </div>

      </div>
    </div>
  );
}