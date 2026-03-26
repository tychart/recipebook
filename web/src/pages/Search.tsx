import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { searchRecipes } from "../api/search";
import type { SemanticSearchResult } from "../../types/types";

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 25;

function clampLimit(limit: number): number {
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.trunc(limit)));
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}% match`;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [query]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const nextResults = await searchRecipes({
        query: trimmedQuery,
        limit: clampLimit(limit),
      });
      setResults(nextResults);
    } catch {
      setResults([]);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-red-950/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,245,235,0.96))] p-6 shadow-[0_24px_80px_rgba(125,38,9,0.10)] sm:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top,rgba(210,20,4,0.14),transparent_60%)]" />
        <div className="relative max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-red-700/70">
            Semantic recipe search
          </p>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Search recipes
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            Search by recipe name, ingredients, or instructions using natural language and surface the closest matches across your accessible cookbooks.
          </p>
        </div>

        <form className="relative mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block" htmlFor="semantic-search-query">
            <span className="sr-only">Search recipes</span>
            <textarea
              id="semantic-search-query"
              ref={textareaRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Try “spicy chicken tacos with lime crema” or paste a full dish idea..."
              rows={2}
              aria-label="Search recipes"
              className="min-h-[4.5rem] w-full resize-none overflow-hidden rounded-[1.75rem] border border-red-950/10 bg-white/90 px-5 py-4 text-base leading-7 text-stone-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none ring-0 placeholder:text-stone-400 focus:border-red-400/70 focus:shadow-[0_0_0_4px_rgba(210,20,4,0.08)] sm:px-6 sm:py-5 sm:text-lg"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="w-full max-w-[9rem]" htmlFor="semantic-search-limit">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Results
              </span>
              <input
                id="semantic-search-limit"
                type="number"
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                value={limit}
                onChange={(event) => setLimit(clampLimit(Number(event.target.value) || DEFAULT_LIMIT))}
                className="w-full rounded-2xl border border-red-950/10 bg-white px-4 py-3 text-base text-stone-900 outline-none focus:border-red-400/70 focus:shadow-[0_0_0_4px_rgba(210,20,4,0.08)]"
                aria-label="Results"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full rounded-2xl border border-red-900 bg-red-700 px-6 py-3 text-base font-semibold text-white shadow-[0_14px_28px_rgba(140,26,18,0.24)] transition hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-[0_20px_36px_rgba(140,26,18,0.28)] disabled:hover:translate-y-0 sm:w-auto"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800 shadow-sm"
        >
          {error}
        </div>
      ) : null}

      {!hasSearched ? (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-red-950/15 bg-white/70 px-6 py-10 text-center shadow-[0_10px_30px_rgba(125,38,9,0.05)]">
          <p className="text-lg font-medium text-stone-700">Search results will appear here.</p>
          <p className="mt-2 text-sm text-stone-500">
            Describe a dish, ingredients, flavor profile, or cooking style to explore your recipe library.
          </p>
        </div>
      ) : null}

      {hasSearched && !loading && !error && results.length === 0 ? (
        <div className="mt-8 rounded-[1.75rem] border border-amber-200 bg-amber-50/90 px-6 py-10 text-center shadow-[0_12px_32px_rgba(146,64,14,0.08)]">
          <p className="text-lg font-medium text-stone-800">No recipes matched that search.</p>
          <p className="mt-2 text-sm text-stone-600">
            Try a broader description, fewer ingredients, or a different cuisine cue.
          </p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                Top matches
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-stone-900">
                {results.length} recipe{results.length === 1 ? "" : "s"} found
              </h2>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {results.map((result) => (
              <Link
                key={result.recipe_id}
                to={`/recipe/${result.recipe_id}`}
                className="group grid overflow-hidden rounded-[1.75rem] border border-red-950/10 bg-white shadow-[0_18px_48px_rgba(125,38,9,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(125,38,9,0.14)] sm:grid-cols-[14rem_minmax(0,1fr)]"
              >
                <div className="relative min-h-56 overflow-hidden bg-stone-200">
                  {result.image_url ? (
                    <img
                      src={result.image_url}
                      alt={result.recipe_name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#fca5a5,#fed7aa)] px-6 text-center text-sm font-semibold uppercase tracking-[0.25em] text-red-950/55">
                      No image
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-xs font-semibold tracking-wide text-red-800 backdrop-blur">
                    {formatScore(result.score)}
                  </div>
                </div>

                <div className="flex flex-col justify-between p-5 sm:p-6">
                  <div>
                    <p className="text-sm font-medium text-stone-500">
                      {result.cookbook_name}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                      {result.recipe_name}
                    </h3>
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="text-sm text-stone-500">
                      Category: <span className="font-medium text-stone-700">{result.category}</span>
                    </p>
                    {result.tags && result.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.tags.map((tag) => (
                          <span
                            key={`${result.recipe_id}-${tag}`}
                            className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400">No tags</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
