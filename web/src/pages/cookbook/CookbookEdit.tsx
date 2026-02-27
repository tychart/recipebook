import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCookbook, editCookbook } from "../../api/cookbooks";
import type { Cookbook } from "../../../types/types";
import CookbookForm from "../../components/CookbookForm";

export default function CookbookEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCookbook = async () => {
      try {
        const data = await getCookbook(Number(id));
        setCookbook(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load cookbook");
      } finally {
        setLoading(false);
      }
    };

    fetchCookbook();
  }, [id]);

  const handleUpdate = async (updated: Partial<Cookbook>) => {
  if (!id || !cookbook) return;

  try {
    const fullCookbook: Cookbook = {
      ...cookbook,     
      ...updated,       
      id: Number(id),  
    };

    const result = await editCookbook(fullCookbook);
    console.log("Updated cookbook:", result);
    navigate(`/cookbook/${id}`);
  } catch (err) {
    console.error("Failed to update cookbook", err);
    alert("Failed to update cookbook");
  }
};

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!cookbook) return <p>Cookbook not found</p>;

  return (
    <div className="py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Edit Cookbook</h1>
        <Link
          to={`/cookbook/${id}`}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </Link>
      </div>

      <CookbookForm
        initialData={cookbook}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </div>
  );
}