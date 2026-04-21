import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CookbookCard } from "../../components/cards/CookbookCard";
import { listCookbooks } from "../../api/cookbooks";
import type { Cookbook } from "../../../types/types";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppButton } from "../../components/ui/AppButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionCard } from "../../components/ui/SectionCard";
import { getWritableCookbooks } from "../../lib/cookbookAccess";

export default function Cookbooks() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    listCookbooks(user.id)
      .then(setCookbooks)
      .catch(() => setError("Failed to load cookbooks"))
      .finally(() => setLoading(false));
  }, [user]);

  const ownerCookbooks = useMemo(
    () => cookbooks.filter((cookbook) => cookbook.current_user_role === "owner"),
    [cookbooks],
  );
  const contributorCookbooks = useMemo(
    () => cookbooks.filter((cookbook) => cookbook.current_user_role === "contributor"),
    [cookbooks],
  );
  const viewerCookbooks = useMemo(
    () => cookbooks.filter((cookbook) => cookbook.current_user_role === "viewer"),
    [cookbooks],
  );
  const writableCookbooks = useMemo(() => getWritableCookbooks(cookbooks), [cookbooks]);

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
          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap gap-3">
              <Link to="/cookbooks/new">
                <AppButton variant="primary">New Cookbook</AppButton>
              </Link>
              {writableCookbooks.length > 0 ? (
                <Link to="/recipe/new">
                  <AppButton>New Recipe</AppButton>
                </Link>
              ) : (
                <AppButton disabled aria-disabled="true">
                  New Recipe
                </AppButton>
              )}
            </div>
            {writableCookbooks.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Create a cookbook or get contributor access before starting a new recipe.
              </p>
            ) : null}
          </div>
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
