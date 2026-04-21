import { useState } from "react";
import type { Cookbook } from "../../types/types";
import { AppButton } from "./ui/AppButton";
import { SectionCard } from "./ui/SectionCard";

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
      className="space-y-6"
    >
      <SectionCard title="Cookbook details" description="Keep the name clear and the categories broad enough to stay useful over time.">
        <div className="space-y-5">
        <div>
        <label className="app-label">Cookbook Name</label>
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          className="app-input"
        />
      </div>

      <div>
        <label className="app-label">
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
          className="app-input"
        />
      </div>
        </div>
      </SectionCard>

      <AppButton type="submit" variant="primary">
        {submitLabel}
      </AppButton>
    </form>
  );
}
