import { useNavigate } from "react-router-dom";
import { createCookbook } from "../../api/cookbooks";
import CookbookForm from "../../components/CookbookForm";

export default function CookbookNew() {
  const navigate = useNavigate();

  const handleCreate = async (data: any) => {
  const result = await createCookbook(data);
  navigate(`/cookbook/${result.cookbook.id}`);
};

  return (
    <>
      <h1 className="text-2xl font-semibold">New Cookbook</h1>
      <CookbookForm initialData={{}} onSubmit={handleCreate} submitLabel="Create" />
    </>
  );
}