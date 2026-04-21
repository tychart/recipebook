import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CookbookCard } from "../../components/cards/CookbookCard";
import { listCookbooks } from "../../api/cookbooks";
import type { Cookbook } from "../../../types/types";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppButton } from "../../components/ui/AppButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionCard } from "../../components/ui/SectionCard";

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
    return (
      <EmptyState
        title="Please log in to view your cookbooks."
        description="Your owned, shared, and read-only cookbooks will appear here once you're signed in."
      />
    );
  }

  if (loading) return <p className="py-6 text-sm text-[var(--text-secondary)]">Loading your cookbooks...</p>;
  if (error) return <p className="py-6 text-sm text-rose-600 dark:text-rose-200">{error}</p>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-6">
      <PageHeader
        eyebrow="Library"
        title="My Cookbooks"
        description="Browse the cookbooks you own, contribute to, or can view. The layout stays roomy on phones and scales cleanly up to desktop."
        actions={
          <Link to="/cookbooks/new">
            <AppButton variant="primary">New Cookbook</AppButton>
          </Link>
        }
      />

      <SectionCard title="Owned by you" description="Your main cookbook collection lives here.">
        {ownerCookbooks.length === 0 ? (
          <EmptyState
            title="No cookbooks yet."
            description="Create your first cookbook to start collecting recipes, categories, and shared kitchen notes."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ownerCookbooks.map((book) => (
              <CookbookCard key={book.id} cookbook={book} />
            ))}
          </div>
        )}
      </SectionCard>

        {contributorCookbooks.length > 0 ? (
          <SectionCard
            title="Contributor Cookbooks"
            description="Cookbooks where you can add, edit, and collaborate on recipes."
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {contributorCookbooks.map((book) => (
                <CookbookCard key={book.id} cookbook={book} />
              ))}
            </div>
          </SectionCard>
        ) : null}

        {viewerCookbooks.length > 0 ? (
          <SectionCard
            title="Viewer Cookbooks"
            description="Shared cookbooks you can browse without editing."
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {viewerCookbooks.map((book) => (
                <CookbookCard key={book.id} cookbook={book} />
              ))}
            </div>
          </SectionCard>
        ) : null}
    </div>
  );
}
