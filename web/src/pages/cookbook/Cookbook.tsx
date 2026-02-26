import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCookbook } from "../../api/cookbooks";
import type { Cookbook as CookbookType } from "../../../types/types";

export default function Cookbook() {
  const { id } = useParams<{ id: string }>();
  const [cookbook, setCookbook] = useState<CookbookType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!id) return;

  const numericId = Number(id);
  if (isNaN(numericId)) {
    console.error("Invalid cookbook id:", id);
    setLoading(false);
    return;
  }

  getCookbook(numericId)
    .then(setCookbook)
    .catch(console.error)
    .finally(() => setLoading(false));
}, [id]);

  if (loading) return <p>Loading...</p>;
  if (!cookbook) return <p>Not found</p>;

  return (
    <div>
      <h1>{cookbook.name}</h1>
      <Link to={`/cookbook/${id}/recipe/new`}>
        Add recipe
      </Link>
    </div>
  );
}