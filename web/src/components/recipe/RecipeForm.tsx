import { useEffect, useState } from "react";
import type { Ingredient, RecipeInput } from "../../../types/types";
import RecipeImage from "./RecipeImage";
import { AppButton } from "../ui/AppButton";
import { SectionCard } from "../ui/SectionCard";

interface RecipeFormProps {
  initialData: RecipeInput;
  onSubmit: (recipe: RecipeInput, imageFile?: File) => void;
  categories: string[] | undefined;
  submitLabel?: string;
}

export default function RecipeForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
  categories
}: RecipeFormProps) {
  const [recipe, setRecipe] = useState<RecipeInput>(initialData);
  const [selectedImageFile, setSelectedImageFile] = useState<File>();
  const [originalImageUrl, setOriginalImageUrl] = useState(initialData.image_url ?? "");
  const [tagInput, setTagInput] = useState(initialData.tags?.join(", ") ?? "");

  useEffect(() => {
    setRecipe(initialData);
    setOriginalImageUrl(initialData.image_url ?? "");
    setTagInput(initialData.tags?.join(", ") ?? "");
    setSelectedImageFile(undefined);
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setRecipe((prev) => ({
      ...prev,
      // Ensure servings cannot be less than 0
      [name]: name === "servings" ? Math.max(0, Number(value)) : value,
    }));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number,
  ) => {
    setRecipe((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = {
        ...updated[index],
        // Ensure amount cannot be less than 0
        [field]: field === "amount" ? Math.max(0, Number(value)) : value,
      };
      return { ...prev, ingredients: updated };
    });
  };

  const handleAddIngredient = () => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          amount: 0,
          unit: "",
          name: "",
        },
      ],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    setRecipe((prev) => {
      const updated = [...(prev.instructions ?? [])];
      updated[index] = value;
      return { ...prev, instructions: updated };
    });
  };

  const handleAddInstruction = () => {
    setRecipe((prev) => ({
      ...prev,
      instructions: [...(prev.instructions ?? []), ""],
    }));
  };

  const handleRemoveInstruction = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      instructions: (prev.instructions ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    const parsedTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({ ...recipe, tags: parsedTags }, selectedImageFile);
  };

  
  const getCategories = (): string[] => {
    if (categories === undefined) {
      return ["Main", "Dessert", "Snacks", "Breakfast", ""];
    }
    return categories;
  };
  categories = getCategories();


  return (
    <div className="py-6 max-w-5xl mx-auto">
      <div className="space-y-6">
        <RecipeImage
          imageUrl={recipe.image_url}
          editable
          alt={recipe.name || "Recipe Image"}
          onEditClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e: Event) => {
              const target = e.target as HTMLInputElement;
              const file = target.files?.[0];
              if (file) {
                setSelectedImageFile(file);
                setRecipe((prev) => ({
                  ...prev,
                  image_url: URL.createObjectURL(file),
                }));
              }
            };
            input.click();
          }}
          onRemoveClick={() => {
            setSelectedImageFile(undefined);
            setRecipe((prev) => ({
              ...prev,
              image_url: originalImageUrl,
            }));
          }}
        />

        <SectionCard title="Recipe details" description="Capture the headline information people need before they start cooking.">
          <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="app-label">Recipe Name</label>
          <input
            type="text"
            name="name"
            value={recipe.name}
            onChange={handleChange}
            className="app-input"
          />
        </div>

        <div className="md:col-span-2">
          <label className="app-label">Description</label>
          <textarea
            name="description"
            value={recipe.description ?? ""}
            onChange={handleChange}
            rows={3}
            className="app-textarea"
          />
        </div>

        <div>
          <label className="app-label">Category</label>
          <select
            name="category"
            value={recipe.category || ""}
            onChange={handleChange}
            className="app-select"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories!.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="app-label">Tags (comma separated)</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. gluten-free, quick"
            className="app-input"
          />
        </div>

        <div>
          <label className="app-label">Servings</label>
          <input
            type="number"
            name="servings"
            min="0"
            value={recipe.servings}
            onChange={handleChange}
            className="app-input max-w-32"
          />
        </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Ingredients"
          description="List the ingredients in a way that stays easy to scan on a phone or tablet."
          actions={
            <AppButton
              type="button"
              onClick={handleAddIngredient}
              variant="primary"
            >
              Add Ingredient
            </AppButton>
          }
        >

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="grid gap-3 rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4 md:grid-cols-[7rem_8rem_minmax(0,1fr)_auto] md:items-center">
                <input
                  type="number"
                  min="0"
                  value={ingredient.amount}
                  onChange={(e) =>
                    handleIngredientChange(
                      index,
                      "amount",
                      Number(e.target.value),
                    )
                  }
                  placeholder="Amount"
                  className="app-input"
                />

                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(e) =>
                    handleIngredientChange(index, "unit", e.target.value)
                  }
                  placeholder="Unit"
                  className="app-input"
                />

                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) =>
                    handleIngredientChange(index, "name", e.target.value)
                  }
                  placeholder="Ingredient"
                  className="app-input"
                />

                <AppButton type="button" variant="ghost" onClick={() => handleRemoveIngredient(index)}>
                  Remove
                </AppButton>
              </div>
            ))}

            {recipe.ingredients.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">
                Click + to add your first ingredient
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Instructions"
          description="Break the method into simple steps that stay comfortable to edit from smaller devices."
          actions={
            <AppButton
              type="button"
              onClick={handleAddInstruction}
              variant="primary"
            >
              Add Step
            </AppButton>
          }
        >

          <div className="space-y-3">
            {(recipe.instructions ?? []).map((step, index) => (
              <div key={index} className="grid gap-3 rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4 md:grid-cols-[3rem_minmax(0,1fr)_auto] md:items-center">
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--accent-soft)] font-medium text-[var(--text-primary)]">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) =>
                    handleInstructionChange(index, e.target.value)
                  }
                  placeholder={`Step ${index + 1}`}
                  className="app-input"
                />

                <AppButton type="button" variant="ghost" onClick={() => handleRemoveInstruction(index)}>
                  Remove
                </AppButton>
              </div>
            ))}

            {(recipe.instructions ?? []).length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">
                Click + to add your first instruction
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Notes" description="Optional notes are great for family tweaks, substitutions, or serving reminders.">
          <label className="app-label">Notes</label>
          <textarea
            name="notes"
            value={recipe.notes ?? ""}
            onChange={handleChange}
            rows={3}
            className="app-textarea"
          />
        </SectionCard>

        <div className="pt-2">
          <AppButton type="button" onClick={handleSubmit} variant="primary">
            {submitLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
