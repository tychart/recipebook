import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Cookbook } from "../../../types/types";
import { createCookbook } from "../../api/cookbooks";
import CookbookForm from "../../components/CookbookForm";

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
    <>
      <h1 className="text-2xl font-semibold">New Cookbook</h1>
      <CookbookForm initialData={{}} onSubmit={handleCreate} submitLabel="Create cookbook" />
    </>
  );
}