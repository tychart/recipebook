import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBorderTheme } from "../../context/BorderThemeContext";
import { listCookbooks } from "../../api/cookbooks";
import { listRecipes } from "../../api/recipes";
import {
  BORDER_THEME_IDS,
  BORDER_THEME_LABELS,
  themePreviewSurface,
} from "../../theme/borderTheme";

function fieldBox(label: string, children: ReactNode) {
  return (
    <div className="rounded-lg border border-black/10 bg-stone-50 p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">
        {label}
      </p>
      <div className="text-lg text-black break-all">{children}</div>
    </div>
  );
}

function statBox(label: string, display: string | number) {
  return (
    <div className="rounded-lg border border-black/10 bg-stone-50 shadow-sm w-full h-20 px-3 flex flex-col items-center justify-center text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 leading-tight">
        {label}
      </p>
      <p className="text-2xl font-semibold text-black mt-0.5 tabular-nums leading-none">
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
        <p className="mb-4">Please log in to view your account details.</p>
        <Link
          to="/login"
          className="text-red-500 font-medium hover:text-red-600 underline"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 w-full max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Account Details</h1>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 w-full">
        <div className="min-w-0 w-full max-w-lg flex flex-col gap-4">
          {fieldBox("Username", user.username)}
          {fieldBox("Email", user.email)}

          <div className="rounded-lg border border-black/10 bg-stone-50 p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">
              Page border
            </p>
            <p className="text-sm text-stone-600 mb-4">
              Choose a gingham border color for your account page.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {BORDER_THEME_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBorderTheme(id)}
                  className={`rounded-lg border-2 p-2 flex flex-col items-center gap-2 transition ${
                    borderTheme === id
                      ? "border-black ring-2 ring-black/20 ring-offset-2"
                      : "border-black/15 hover:border-black/35"
                  }`}
                >
                  <div
                    className="h-8 w-full rounded border border-black/10"
                    style={themePreviewSurface(id)}
                  />
                  <span className="text-xs font-medium text-black">
                    {BORDER_THEME_LABELS[id]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
          {statsError ? (
            <p className="text-sm text-red-600">{statsError}</p>
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
