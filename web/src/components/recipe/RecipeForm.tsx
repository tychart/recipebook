import { useEffect, useState } from "react";
import type { RecipeInput } from "../../../types/types";
import RecipeImage from "./RecipeImage";
import { AppButton } from "../ui/AppButton";
import { AppSelect } from "../ui/AppSelect";
import { SectionCard } from "../ui/SectionCard";

type RecipeIngredientInput = RecipeInput["ingredients"][number];

const INGREDIENT_AMOUNT_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

function formatIngredientAmountForInput(amount: number): string {
  return amount > 0 ? String(amount) : "";
}

function isValidIngredientAmountDraft(value: string): boolean {
  return value === "" || INGREDIENT_AMOUNT_PATTERN.test(value);
}

function normalizeIngredientAmount(value: string): number {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

interface RecipeFormProps {
  recipe: RecipeInput;
  onRecipeChange: (recipe: RecipeInput) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  selectedImageFile?: File;
  onSelectedImageFileChange: (file: File | undefined) => void;
  originalImageUrl: string;
  onSubmit: (recipe: RecipeInput, imageFile?: File) => void;
  categories: string[] | undefined;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitHint?: string;
}

export default function RecipeForm({
  recipe,
  onRecipeChange,
  tagInput,
  onTagInputChange,
  selectedImageFile,
  onSelectedImageFileChange,
  originalImageUrl,
  onSubmit,
  submitLabel = "Save",
  categories,
  submitDisabled = false,
  submitHint,
}: RecipeFormProps) {
  const [ingredientAmountDrafts, setIngredientAmountDrafts] = useState<string[]>(() =>
    recipe.ingredients.map((ingredient) => formatIngredientAmountForInput(ingredient.amount)),
  );
  const [focusedIngredientAmountIndex, setFocusedIngredientAmountIndex] = useState<number | null>(null);

  useEffect(() => {
    setIngredientAmountDrafts((currentDrafts) =>
      recipe.ingredients.map((ingredient, index) =>
        focusedIngredientAmountIndex === index
          ? currentDrafts[index] ?? formatIngredientAmountForInput(ingredient.amount)
          : formatIngredientAmountForInput(ingredient.amount),
      ),
    );

    if (
      focusedIngredientAmountIndex !== null &&
      focusedIngredientAmountIndex >= recipe.ingredients.length
    ) {
      setFocusedIngredientAmountIndex(null);
    }
  }, [focusedIngredientAmountIndex, recipe.ingredients]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    onRecipeChange({
      ...recipe,
      [name]: name === "servings" ? Math.max(0, Number(value)) : value,
    });
  };

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredientInput,
    value: string | number,
  ) => {
    const updated = [...recipe.ingredients];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount" ? Math.max(0, Number(value)) : value,
    };

    onRecipeChange({ ...recipe, ingredients: updated });
  };

  const handleIngredientAmountInputChange = (index: number, value: string) => {
    if (!isValidIngredientAmountDraft(value)) {
      return;
    }

    setIngredientAmountDrafts((currentDrafts) => {
      const nextDrafts = [...currentDrafts];
      nextDrafts[index] = value;
      return nextDrafts;
    });

    handleIngredientChange(index, "amount", normalizeIngredientAmount(value));
  };

  const handleAddIngredient = () => {
    onRecipeChange({
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        {
          amount: 0,
          unit: "",
          name: "",
        },
      ],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    onRecipeChange({
      ...recipe,
      ingredients: recipe.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...(recipe.instructions ?? [])];
    updated[index] = value;
    onRecipeChange({ ...recipe, instructions: updated });
  };

  const handleAddInstruction = () => {
    onRecipeChange({
      ...recipe,
      instructions: [...(recipe.instructions ?? []), ""],
    });
  };

  const handleRemoveInstruction = (index: number) => {
    onRecipeChange({
      ...recipe,
      instructions: (recipe.instructions ?? []).filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    const parsedTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({ ...recipe, tags: parsedTags }, selectedImageFile);
  };

  const resolvedCategories =
    categories === undefined
      ? ["Main", "Dessert", "Snacks", "Breakfast", ""]
      : categories;
  const categoryOptions = resolvedCategories
    .filter((category) => category.trim() !== "")
    .map((category) => ({ value: category, label: category }));

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="space-y-6">
        <RecipeImage
          imageUrl={recipe.image_url}
          editable
          alt={recipe.name || "Recipe Image"}
          onEditClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (event: Event) => {
              const target = event.target as HTMLInputElement;
              const file = target.files?.[0];
              if (file) {
                onSelectedImageFileChange(file);
                onRecipeChange({
                  ...recipe,
                  image_url: URL.createObjectURL(file),
                });
              }
            };
            input.click();
          }}
          onRemoveClick={() => {
            onSelectedImageFileChange(undefined);
            onRecipeChange({
              ...recipe,
              image_url: originalImageUrl,
            });
          }}
        />

        <SectionCard
          title="Recipe details"
          description="Capture the headline information people need before they start cooking."
        >
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
              <AppSelect
                value={recipe.category || ""}
                onValueChange={(nextValue) =>
                  onRecipeChange({
                    ...recipe,
                    category: nextValue,
                  })
                }
                options={categoryOptions}
                placeholder="Select a category"
                ariaLabel="Category"
              />
            </div>

            <div>
              <label className="app-label">Tags (comma separated)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(event) => onTagInputChange(event.target.value)}
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
            <AppButton type="button" onClick={handleAddIngredient} variant="primary">
              Add Ingredient
            </AppButton>
          }
        >
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4 md:grid-cols-[7rem_8rem_minmax(0,1fr)_auto] md:items-center"
              >
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={ingredientAmountDrafts[index] ?? ""}
                  onFocus={() => setFocusedIngredientAmountIndex(index)}
                  onBlur={() => setFocusedIngredientAmountIndex((currentIndex) => (currentIndex === index ? null : currentIndex))}
                  onKeyDown={(event) => {
                    if (event.key === "-" || event.key === "e" || event.key === "E" || event.key === "+") {
                      event.preventDefault();
                      return;
                    }

                    if ((ingredientAmountDrafts[index] ?? "") !== "") {
                      return;
                    }

                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      handleIngredientAmountInputChange(index, "1");
                    }

                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                    }
                  }}
                  onChange={(event) =>
                    handleIngredientAmountInputChange(index, event.target.value)
                  }
                  placeholder="0"
                  aria-label={`Ingredient ${index + 1} amount`}
                  className="app-input focus:placeholder:text-transparent"
                />

                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(event) =>
                    handleIngredientChange(index, "unit", event.target.value)
                  }
                  placeholder="Unit"
                  className="app-input"
                />

                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(event) =>
                    handleIngredientChange(index, "name", event.target.value)
                  }
                  placeholder="Ingredient"
                  className="app-input"
                />

                <AppButton type="button" variant="ghost" onClick={() => handleRemoveIngredient(index)}>
                  Remove
                </AppButton>
              </div>
            ))}

            {recipe.ingredients.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Click + to add your first ingredient
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Instructions"
          description="Break the method into simple steps that stay comfortable to edit from smaller devices."
          actions={
            <AppButton type="button" onClick={handleAddInstruction} variant="primary">
              Add Step
            </AppButton>
          }
        >
          <div className="space-y-3">
            {(recipe.instructions ?? []).map((step, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4 md:grid-cols-[3rem_minmax(0,1fr)_auto] md:items-center"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--interactive-soft)] font-medium text-[var(--text-primary)]">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(event) => handleInstructionChange(index, event.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className="app-input"
                />

                <AppButton type="button" variant="ghost" onClick={() => handleRemoveInstruction(index)}>
                  Remove
                </AppButton>
              </div>
            ))}

            {(recipe.instructions ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Click + to add your first instruction
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Notes"
          description="Optional notes are great for family tweaks, substitutions, or serving reminders."
        >
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
          <AppButton type="button" onClick={handleSubmit} variant="primary" disabled={submitDisabled}>
            {submitLabel}
          </AppButton>
          {submitHint ? (
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{submitHint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
