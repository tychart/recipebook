import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBorderTheme } from "../../context/BorderThemeContext";
import { ThemeSelector } from "../../components/ui/ThemeSelector";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { listCookbooks } from "../../api/cookbooks";
import { listRecipes } from "../../api/recipes";
import {
  BORDER_THEME_IDS,
  BORDER_THEME_LABELS,
  themePreviewSurface,
} from "../../theme/borderTheme";

function fieldBox(label: string, children: ReactNode) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-5">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-muted)] mb-2">
        {label}
      </p>
      <div className="text-lg text-[var(--text-primary)] break-all">{children}</div>
    </div>
  );
}

function statBox(label: string, display: string | number) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] w-full min-h-28 px-4 py-4 flex flex-col items-center justify-center text-center">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-muted)] leading-tight">
        {label}
      </p>
      <p className="text-3xl font-semibold text-[var(--text-primary)] mt-1 tabular-nums leading-none">
        {display}
      </p>
    </div>
  );
}

export default function Account() {
  const { user, isInitializing } = useAuth();
  const { borderTheme, setBorderTheme } = useBorderTheme();
  const [stats, setStats] = useState<{
    contributorCookbooks: number;
    viewerCookbooks: number;
    recipes: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || isInitializing) {
      return;
    }

    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);

    (async () => {
      try {
        const cookbooks = await listCookbooks(user.id);
        const contributorCookbooks = cookbooks.filter(
          (c) => c.current_user_role === "contributor" || c.current_user_role === "owner",
        ).length;
        const viewerCookbooks = cookbooks.filter((c) => c.current_user_role === "viewer").length;
        const recipeLists = await Promise.all(cookbooks.map((c) => listRecipes(c.id)));
        const recipes = recipeLists.reduce((sum, arr) => sum + arr.length, 0);
        if (!cancelled) {
          setStats({ contributorCookbooks, viewerCookbooks, recipes });
        }
      } catch {
        if (!cancelled) {
          setStatsError("Could not load stats.");
          setStats(null);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isInitializing]);

  if (isInitializing) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div className="py-6">
        <EmptyState
          title="Please log in to view your account."
          description="Your account details, theme settings, and library stats will appear here once you sign in."
        />
        <Link to="/login" className="app-link mt-4 inline-flex font-semibold">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 w-full max-w-6xl">
      <PageHeader
        eyebrow="Settings"
        title="Account Details"
        description="Manage your profile, choose how RecipeBook looks, and see a quick summary of your shared library."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <SectionCard title="Profile">
          {fieldBox("Username", user.username)}
          {fieldBox("Email", user.email)}
          </SectionCard>

          <SectionCard
            title="Theme"
            description="Default to your system theme, or choose a dedicated light or dark experience."
          >
            <ThemeSelector />
          </SectionCard>

          <SectionCard
            title="Accent palette"
            description="Pick the warm accent color used for highlights, calls to action, and subtle decorative motifs."
          >
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-muted)] mb-4">
              Accent palette
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {BORDER_THEME_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBorderTheme(id)}
                  className={`flex min-h-28 flex-col items-center justify-center gap-3 rounded-[1.5rem] border p-3 text-center transition ${
                    borderTheme === id
                      ? "border-[var(--accent-border)] bg-[var(--accent-soft)]"
                      : "border-[var(--border-muted)] bg-[var(--surface-soft)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div
                    className="h-10 w-full rounded-2xl"
                    style={themePreviewSurface(id)}
                  />
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {BORDER_THEME_LABELS[id]}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="w-full shrink-0 flex flex-col gap-3">
          {statsError ? (
            <p className="text-sm text-rose-600 dark:text-rose-200">{statsError}</p>
          ) : null}
          {statBox(
            "Contributor cookbooks",
            statsLoading ? "…" : statsError ? "—" : (stats?.contributorCookbooks ?? 0),
          )}
          {statBox(
            "Viewer cookbooks",
            statsLoading ? "…" : statsError ? "—" : (stats?.viewerCookbooks ?? 0),
          )}
          {statBox(
            "Total recipes",
            statsLoading ? "…" : statsError ? "—" : (stats?.recipes ?? 0),
          )}
        </aside>
      </div>
    </div>
  );
}
