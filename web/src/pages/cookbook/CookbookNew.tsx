import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Cookbook } from "../../../types/types";
import { createCookbook } from "../../api/cookbooks";
import CookbookForm from "../../components/CookbookForm";
import { PageHeader } from "../../components/ui/PageHeader";

export default function CookbookNew() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (data: Partial<Cookbook>) => {
    if (!user) return;

    const payload = {
      name: data.name || "",
      owner_id: user.id,
      categories: data.categories || [],
    };

    const result = await createCookbook(payload);
    navigate(`/cookbook/${result.cookbook.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-6">
      <PageHeader
        eyebrow="Create"
        title="New Cookbook"
        description="Start a new collection with a clear name and a few broad categories so recipes stay easy to sort later."
      />
      <CookbookForm initialData={{}} onSubmit={handleCreate} submitLabel="Create Cookbook" />
    </div>
  );
}
