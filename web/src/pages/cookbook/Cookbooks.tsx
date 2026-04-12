import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CookbookCard } from "../../components/cards/CookbookCard";
import { listCookbooks } from "../../api/cookbooks";
import type { Cookbook } from "../../../types/types";
import { useAuth } from "../../context/AuthContext";

export default function Cookbooks() {
  const [ownerCookbooks, setOwnerCookbooks] = useState<Cookbook[]>([]);
  const [contributorCookbooks, setContributorCookbooks] = useState<Cookbook[]>(
    [],
  );
  const [viewerCookbooks, setViewerCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    listCookbooks(user.id)
      .then((cookbooks) => {
        setOwnerCookbooks([]);
        setContributorCookbooks([]);
        setViewerCookbooks([]);
        return sortCookbooks(cookbooks);
      })
      .catch(() => setError("Failed to load cookbooks"))
      .finally(() => setLoading(false));
  }, []);

  const sortCookbooks = async (cookbooks: Cookbook[]) => {
    for (const cookbook of cookbooks) {
      switch (cookbook.current_user_role) {
        case "owner":
          setOwnerCookbooks((prev) => [...prev, cookbook]);
          break;
        case "contributor":
          setContributorCookbooks((prev) => [...prev, cookbook]);
          break;
        case "viewer":
          setViewerCookbooks((prev) => [...prev, cookbook]);
          break;
        default:
          console.warn("Unexpected cookbook role; defaulting to viewer", {
            cookbookId: cookbook.id,
            current_user_role: cookbook.current_user_role,
          });
          setViewerCookbooks((prev) => [...prev, cookbook]);
          break;
      }
    }
  };

  //Replace this with actual user ID
  if (!user) {
    return <p>Please log in to view your cookbooks.</p>;
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="mx-auto w-full max-w-7xl py-6">
      <div>
        <div className="flex flex-col lg:flex-row items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">My Cookbooks</h1>
          <Link
            to="/cookbooks/new"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white text-gray-900 hover:bg-gray-100 transition"
          >
            New Cookbook
          </Link>
        </div>

        {ownerCookbooks.length === 0 ? (
          <p className="text-gray-500">No cookbooks yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownerCookbooks.map((book) => (
              <CookbookCard key={book.id} cookbook={book} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-4">
        {contributorCookbooks.length > 0 ? (
          <div>
            <h1 className="text-2xl font-semibold">Contributor Cookbooks</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributorCookbooks.map((book) => (
                <CookbookCard key={book.id} cookbook={book} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-4">
        {viewerCookbooks.length > 0 ? (
          <div>
            <h1 className="text-2xl font-semibold">Viewer Cookbooks</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewerCookbooks.map((book) => (
                <CookbookCard key={book.id} cookbook={book} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
