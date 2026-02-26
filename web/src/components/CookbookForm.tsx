import { useState } from "react";
import type { Cookbook } from "../../types/types";

interface CookbookFormProps {
  initialData: Partial<Cookbook>;
  onSubmit: (data: Partial<Cookbook>) => void;
  submitLabel?: string;
}

export default function CookbookForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
}: CookbookFormProps) {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block font-medium">Cookbook Name</label>
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block font-medium">
          Categories (comma separated)
        </label>
        <input
          type="text"
          name="categories"
          value={formData.categories?.join(", ") || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              categories: e.target.value.split(",").map((c) => c.trim()),
            }))
          }
          className="w-full border rounded p-2"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 rounded bg-indigo-600 text-black"
      >
        {submitLabel}
      </button>
    </form>
  );
}
