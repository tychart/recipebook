import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBorderTheme } from "../../context/BorderThemeContext";
import { useIngredientAmountDisplay } from "../../context/IngredientAmountDisplayContext";
import { FormattedIngredientAmount } from "../../components/recipe/FormattedIngredientAmount";
import { ThemeSelector } from "../../components/ui/ThemeSelector";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBanner } from "../../components/ui/StatusBanner";
import { listCookbooks } from "../../api/cookbooks";
import { listRecipes } from "../../api/recipes";
import {
  BORDER_THEME_IDS,
  BORDER_THEME_LABELS,
  themePreviewSurface,
} from "../../theme/borderTheme";
import {
  DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES,
  type IngredientAmountDensity,
  type IngredientAmountStyle,
} from "../../lib/ingredientAmountDisplay";

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

const fractionStyleOptions: Array<{
  value: IngredientAmountStyle;
  label: string;
  description: string;
}> = [
  {
    value: "unicode",
    label: "Unicode fractions",
    description: "Cleaner display using fraction glyphs like 1 1/2 -> 1 1/2 style characters.",
  },
  {
    value: "ascii",
    label: "ASCII fractions",
    description: "Plain text fractions like 1 1/2 that can be easier to read from farther away.",
  },
];

const fractionDensityOptions: Array<{
  value: IngredientAmountDensity;
  label: string;
  description: string;
}> = [
  {
    value: "compact",
    label: "Compact",
    description: "Tighter ingredient amount display for denser recipe lists.",
  },
  {
    value: "normal",
    label: "Normal",
    description: "Balanced display size for everyday browsing.",
  },
  {
    value: "large",
    label: "Large",
    description: "Bigger ingredient amount text for easier reading at a distance.",
  },
];

export default function Account() {
  const { user, isInitializing } = useAuth();
  const { borderTheme, setBorderTheme } = useBorderTheme();
  const {
    preferences: ingredientAmountPreferences,
    setEnabled: setIngredientAmountEnabled,
    setStyle: setIngredientAmountStyle,
    setDisplayDensity: setIngredientAmountDensity,
    resetPreferences: resetIngredientAmountPreferences,
  } = useIngredientAmountDisplay();
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

  const hasCustomizedIngredientAmountPreferences =
    ingredientAmountPreferences.enabled !== DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES.enabled ||
    ingredientAmountPreferences.style !== DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES.style ||
    ingredientAmountPreferences.displayDensity !== DEFAULT_INGREDIENT_AMOUNT_DISPLAY_PREFERENCES.displayDensity;

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
                      ? "border-[var(--interactive-border)] bg-[var(--interactive-soft)]"
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

          <SectionCard
            title="Ingredient amount display"
            description="Show familiar cooking fractions when an ingredient amount is close to a common kitchen measurement, or fall back to decimals when it is not."
          >
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setIngredientAmountEnabled(!ingredientAmountPreferences.enabled)}
                className={`flex w-full items-start justify-between gap-4 rounded-[1.5rem] border p-4 text-left transition ${
                  ingredientAmountPreferences.enabled
                    ? "border-[var(--interactive-border)] bg-[var(--interactive-soft)] shadow-[var(--shadow-soft)]"
                    : "border-[var(--border-muted)] bg-[var(--surface-soft)] hover:border-[var(--border-strong)]"
                }`}
                aria-pressed={ingredientAmountPreferences.enabled}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Display common cooking fractions
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Examples like 0.25 or 0.333 render as familiar fractions, while awkward values stay as their normal decimals.
                  </p>
                </div>
                <span
                  className={`inline-flex min-h-9 min-w-20 items-center justify-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                    ingredientAmountPreferences.enabled
                      ? "border-[var(--interactive-border)] bg-[var(--surface)] text-[var(--text-primary)]"
                      : "border-[var(--border-muted)] bg-[var(--surface)] text-[var(--text-muted)]"
                  }`}
                >
                  {ingredientAmountPreferences.enabled ? "On" : "Off"}
                </span>
              </button>

              <div className="rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Preview
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { amount: 0.25, unit: "cup", name: "milk" },
                    { amount: 0.333, unit: "tsp", name: "salt" },
                    { amount: 1.5, unit: "tbsp", name: "olive oil" },
                    { amount: 0.41, unit: "cup", name: "broth" },
                  ].map((sample) => (
                    <div
                      key={`${sample.amount}-${sample.unit}-${sample.name}`}
                      className="rounded-[1.25rem] border border-[var(--border-muted)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]"
                    >
                      <FormattedIngredientAmount amount={sample.amount} unit={sample.unit} />
                      {" "}
                      {sample.name}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                  Values that are not close to a familiar kitchen fraction keep their normal decimal display.
                </p>
              </div>

              <details className="rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-primary)]">
                  Advanced fraction display settings
                </summary>
                <div className="mt-5 space-y-6">
                  <div>
                    <p className="app-label">Fraction style</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {fractionStyleOptions.map((option) => {
                        const isActive = ingredientAmountPreferences.style === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setIngredientAmountStyle(option.value)}
                            className={`flex min-h-28 flex-col items-start rounded-[1.5rem] border p-4 text-left transition ${
                              isActive
                                ? "border-[var(--interactive-border)] bg-[var(--interactive-soft)] shadow-[var(--shadow-soft)]"
                                : "border-[var(--border-muted)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                            }`}
                          >
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {option.label}
                            </span>
                            <span className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="app-label">Fraction size</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {fractionDensityOptions.map((option) => {
                        const isActive = ingredientAmountPreferences.displayDensity === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setIngredientAmountDensity(option.value)}
                            className={`flex min-h-28 flex-col items-start rounded-[1.5rem] border p-4 text-left transition ${
                              isActive
                                ? "border-[var(--interactive-border)] bg-[var(--interactive-soft)] shadow-[var(--shadow-soft)]"
                                : "border-[var(--border-muted)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                            }`}
                          >
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {option.label}
                            </span>
                            <span className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-[var(--border-muted)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Fraction matching behavior
                    </p>
                    <p className="mt-2 leading-6">
                      RecipeBook only converts amounts that are very close to familiar cooking fractions. Values that do not map cleanly stay as normal decimals.
                    </p>
                  </div>

                  {hasCustomizedIngredientAmountPreferences ? (
                    <div className="flex flex-wrap gap-3">
                      <AppButton onClick={resetIngredientAmountPreferences}>
                        Reset fraction settings
                      </AppButton>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          </SectionCard>
        </div>

        <aside className="w-full shrink-0 flex flex-col gap-3">
          {statsError ? (
            <StatusBanner tone="danger">{statsError}</StatusBanner>
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
