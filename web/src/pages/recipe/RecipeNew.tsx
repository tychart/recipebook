import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Cookbook, RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/recipe/RecipeForm";
import { createRecipeWithImage } from "../../api/recipes";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { getCookbook, listCookbooks } from "../../api/cookbooks";
import { enqueueOcrJob, enqueueTextJob, getJob } from "../../api/jobs";

type QueueNotice = {
  jobId: string;
  source: "text" | "ocr";
};

function buildInitialRecipeData(cookbookId: number | undefined, creatorId: number | undefined): RecipeInput {
  return {
    name: "",
    description: "",
    instructions: [],
    notes: "",
    servings: 1,
    image_url: "",
    ingredients: [],
    cookbook_id: cookbookId ?? 0,
    creator_id: creatorId || 0,
    category: "Main",
    tags: [],
  };
}

export default function RecipeNew() {
  const { cookbookId } = useParams<{ cookbookId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const numericCookbookId = cookbookId ? Number(cookbookId) : undefined;

  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [availableCookbooks, setAvailableCookbooks] = useState<Cookbook[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isTextImportOpen, setIsTextImportOpen] = useState(false);
  const [textImportValue, setTextImportValue] = useState("");
  const [queueNotice, setQueueNotice] = useState<QueueNotice | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [importedRawText, setImportedRawText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipeData, setRecipeData] = useState<RecipeInput>(() =>
    buildInitialRecipeData(numericCookbookId, user?.id),
  );

  useEffect(() => {
    setRecipeData((prev) => ({
      ...prev,
      cookbook_id: numericCookbookId ?? prev.cookbook_id ?? 0,
      creator_id: user?.id || 0,
    }));
  }, [numericCookbookId, user?.id]);

  useEffect(() => {
    if (!numericCookbookId) {
      setCookbook(null);
      return;
    }

    const fetchCookbook = async () => {
      try {
        const data = await getCookbook(numericCookbookId);
        setCookbook(data);
      } catch (error) {
        console.error("Failed to fetch cookbook", error);
      }
    };
    void fetchCookbook();
  }, [numericCookbookId]);

  useEffect(() => {
    if (!user || numericCookbookId) {
      return;
    }

    listCookbooks(user.id)
      .then(setAvailableCookbooks)
      .catch((error) => {
        console.error("Failed to fetch cookbooks", error);
      });
  }, [numericCookbookId, user]);

  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId || !user) {
      setDraftError(null);
      return;
    }

    let active = true;
    setIsDraftLoading(true);
    setDraftError(null);

    getJob(jobId)
      .then((job) => {
        if (!active) return;
        if (job.status !== "succeeded" || !job.result) {
          setDraftError("This job is not ready to open as a draft yet.");
          return;
        }

        setImportedRawText(job.result.raw_text);
        setRecipeData((prev) => ({
          ...prev,
          ...job.result?.draft,
          cookbook_id: numericCookbookId ?? prev.cookbook_id ?? 0,
          creator_id: user.id,
        }));
      })
      .catch((error) => {
        console.error("Failed to load draft job", error);
        if (active) {
          setDraftError("Failed to load that completed job.");
        }
      })
      .finally(() => {
        if (active) {
          setIsDraftLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [numericCookbookId, searchParams, user]);

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setDraftError(null);
    setQueueNotice(null);

    try {
      const queuedJob = await enqueueOcrJob(file);
      setQueueNotice({ jobId: queuedJob.job_id, source: "ocr" });
    } catch (error) {
      console.error("OCR enqueue error:", error);
      alert("Failed to queue image import.");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const handleTextImport = async () => {
    const trimmed = textImportValue.trim();
    if (!trimmed) {
      return;
    }

    setIsProcessing(true);
    setDraftError(null);
    setQueueNotice(null);

    try {
      const queuedJob = await enqueueTextJob(trimmed);
      setQueueNotice({ jobId: queuedJob.job_id, source: "text" });
      setIsTextImportOpen(false);
      setTextImportValue("");
    } catch (error) {
      console.error("Text import enqueue error:", error);
      alert("Failed to queue recipe text.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return <p>Please log in to create a recipe.</p>;
  }

  const handleCreate = async (recipeInput: RecipeInput, imageFile?: File) => {
    const cookbookChoice = numericCookbookId ?? recipeInput.cookbook_id;
    if (!cookbookChoice) {
      alert("Please choose a cookbook before creating the recipe.");
      return;
    }

    try {
      const result = await createRecipeWithImage(
        {
          ...recipeInput,
          cookbook_id: cookbookChoice,
          creator_id: user.id,
        },
        imageFile,
      );

      navigate(`/recipe/${result.recipe.id}`);
    } catch (error) {
      console.error("Failed to create recipe", error);
      alert("Failed to create recipe");
    }
  };

  return (
    <>
      <div className="mx-auto mb-8 flex max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">New Recipe</h1>
          {numericCookbookId ? (
            <p className="mt-1 text-sm text-stone-500">
              Adding to: {cookbook ? cookbook.name : "Loading..."}
            </p>
          ) : (
            <p className="mt-1 text-sm text-stone-500">
              Choose a cookbook after you review the draft.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isDraftLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          >
            {isProcessing ? "Queueing..." : "✨ Scan from Image"}
          </button>
          <button
            onClick={() => setIsTextImportOpen((prev) => !prev)}
            disabled={isProcessing || isDraftLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-100 px-4 py-2 text-stone-700 hover:bg-stone-200 disabled:opacity-50"
          >
            Import from Text
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleOCRUpload}
            className="hidden"
            accept="image/*"
          />

          <Link
            to={numericCookbookId ? `/cookbook/${numericCookbookId}` : "/cookbooks"}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2 text-stone-700 transition-all duration-200 hover:bg-stone-100"
          >
            ← Cancel
          </Link>
        </div>
      </div>

      {queueNotice ? (
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <div>
            <p className="font-semibold">
              {queueNotice.source === "ocr" ? "Image import queued." : "Text import queued."}
            </p>
            <p className="mt-1">
              The request finished quickly and the background worker is processing your recipe now.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center rounded-xl border border-emerald-300 bg-white px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            View Jobs
          </Link>
        </div>
      ) : null}

      {draftError ? (
        <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {draftError}
        </div>
      ) : null}

      {isTextImportOpen ? (
        <div className="mx-auto mb-8 max-w-4xl rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Paste recipe text
          </label>
          <textarea
            value={textImportValue}
            onChange={(event) => setTextImportValue(event.target.value)}
            placeholder="Paste a recipe, blog excerpt, or handwritten transcription here..."
            className="min-h-48 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleTextImport}
              disabled={isProcessing || !textImportValue.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {isProcessing ? "Queueing..." : "Queue Text Import"}
            </button>
            <button
              onClick={() => {
                setIsTextImportOpen(false);
                setTextImportValue("");
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {!numericCookbookId ? (
        <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-stone-200 bg-white/80 px-5 py-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Save to cookbook
          </label>
          <select
            value={recipeData.cookbook_id ?? 0}
            onChange={(event) =>
              setRecipeData((prev) => ({
                ...prev,
                cookbook_id: Number(event.target.value),
              }))
            }
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            <option value={0}>Select a cookbook</option>
            {availableCookbooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {importedRawText ? (
        <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-stone-200 bg-white/80 px-5 py-4 shadow-sm">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-stone-700">
              View imported raw text
            </summary>
            <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-stone-50 p-4 text-xs whitespace-pre-wrap text-stone-700">
              {importedRawText}
            </pre>
          </details>
        </div>
      ) : null}

      {isDraftLoading ? (
        <p className="mx-auto mb-6 max-w-4xl text-sm text-stone-500">Loading completed job draft...</p>
      ) : null}

      <RecipeForm
        key={`${recipeData.name}-${recipeData.cookbook_id ?? 0}`}
        initialData={recipeData}
        onSubmit={handleCreate}
        submitLabel="Create Recipe"
        categories={cookbook?.categories}
      />
    </>
  );
}
