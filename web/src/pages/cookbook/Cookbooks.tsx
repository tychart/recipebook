import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CookbookCard } from "../../components/cards/CookbookCard";
import { listCookbooks } from "../../api/cookbooks";
import type { Cookbook } from "../../../types/types";
import { useAuth } from "../../context/AuthContext";

export default function Cookbooks() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  //Replace this with actual user ID
  if (!user) {
    return <p>Please log in to view your cookbooks.</p>;
  }

  useEffect(() => {
    listCookbooks(user.id)
      .then(setCookbooks)
      .catch(() => setError("Failed to load cookbooks"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cookbooks</h1>
        <Link
          to="/cookbooks/new"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white text-gray-900 hover:bg-gray-100 transition"
        >
          New cookbook
        </Link>
      </div>

      {cookbooks.length === 0 ? (
        <p className="text-gray-500">No cookbooks yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cookbooks.map((book) => (
            <CookbookCard key={book.id} cookbook={book} />
          ))}
        </div>
      )}
    </div>
  );
}