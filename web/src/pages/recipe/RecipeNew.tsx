import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Cookbook, RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/recipe/RecipeForm";
import { createRecipeWithImage } from "../../api/recipes";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { getCookbook, listCookbooks } from "../../api/cookbooks";
import { enqueueImageJob, enqueueTextJob, getJob } from "../../api/jobs";
import { PageHeader } from "../../components/ui/PageHeader";
import { AppButton } from "../../components/ui/AppButton";
import { StatusBanner } from "../../components/ui/StatusBanner";
import { SectionCard } from "../../components/ui/SectionCard";

type QueueNotice = {
  jobId: string;
  source: "text" | "image";
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
  const [imageImportValue, setImageImportValue] = useState("");
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setDraftError(null);
    setQueueNotice(null);

    try {
      const queuedJob = await enqueueImageJob(file, imageImportValue);
      setQueueNotice({ jobId: queuedJob.job_id, source: "image" });
      setImageImportValue("");
    } catch (error) {
      console.error("Image enqueue error:", error);
      alert("Failed to queue image import.");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const handleTextImport = async () => {
    if (!textImportValue.trim()) {
      return;
    }

    setIsProcessing(true);
    setDraftError(null);
    setQueueNotice(null);

    try {
      const queuedJob = await enqueueTextJob(textImportValue);
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
    <div className="space-y-6 py-6">
      <PageHeader
        eyebrow="Create"
        title="New Recipe"
        description={
          numericCookbookId
            ? `Adding to ${cookbook ? cookbook.name : "this cookbook"} with the new mobile-friendly recipe editor.`
            : "Create a recipe from scratch or queue an import from text or image."
        }
        actions={
          <>
            <AppButton
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isDraftLoading}
              variant="primary"
            >
              {isProcessing ? "Queueing..." : "Import from Image"}
            </AppButton>
            <AppButton
              onClick={() => setIsTextImportOpen((prev) => !prev)}
              disabled={isProcessing || isDraftLoading}
            >
              Import from Text
            </AppButton>
            <Link to={numericCookbookId ? `/cookbook/${numericCookbookId}` : "/cookbooks"}>
              <AppButton variant="ghost">Cancel</AppButton>
            </Link>
          </>
        }
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
      />

      <div className="mx-auto w-full max-w-5xl">
        <div>
          {numericCookbookId ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Adding to: {cookbook ? cookbook.name : "Loading..."}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Choose a cookbook after you review the draft.
            </p>
          )}
        </div>
      </div>

      {queueNotice ? (
        <div className="mx-auto max-w-5xl">
        <StatusBanner tone="success" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">
              {queueNotice.source === "image" ? "Image import queued." : "Text import queued."}
            </p>
            <p className="mt-1">
              The request finished quickly and the background worker is processing your recipe now.
            </p>
          </div>
          <Link to="/jobs">
            <AppButton variant="secondary">View Jobs</AppButton>
          </Link>
        </StatusBanner>
        </div>
      ) : null}

      {draftError ? (
        <div className="mx-auto max-w-5xl">
          <StatusBanner tone="danger">{draftError}</StatusBanner>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl">
      <SectionCard title="Optional import notes" description="These notes help the image importer when the photo or scan needs extra context.">
        <label className="app-label">
          Optional image import notes
        </label>
        <textarea
          value={imageImportValue}
          onChange={(event) => setImageImportValue(event.target.value)}
          placeholder="Add a missing title, clarify handwriting, or tell the importer anything the image does not show clearly..."
          className="app-textarea"
        />
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          These notes are sent only during image extraction and are preserved in the job metadata for debugging.
        </p>
      </SectionCard>
      </div>

      {isTextImportOpen ? (
        <div className="mx-auto max-w-5xl">
        <SectionCard title="Paste recipe text" description="Queue a text import from a blog excerpt, transcription, or copied recipe card.">
          <label className="app-label">
            Paste recipe text
          </label>
          <textarea
            value={textImportValue}
            onChange={(event) => setTextImportValue(event.target.value)}
            placeholder="Paste a recipe, blog excerpt, or handwritten transcription here..."
            className="app-textarea min-h-48"
          />
          <div className="mt-3 flex gap-3">
            <AppButton
              onClick={handleTextImport}
              disabled={isProcessing || !textImportValue.trim()}
              variant="primary"
            >
              {isProcessing ? "Queueing..." : "Queue Text Import"}
            </AppButton>
            <AppButton
              onClick={() => {
                setIsTextImportOpen(false);
                setTextImportValue("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </AppButton>
          </div>
        </SectionCard>
        </div>
      ) : null}

      {!numericCookbookId ? (
        <div className="mx-auto max-w-5xl">
        <SectionCard title="Save destination" description="Pick the cookbook that should own this new recipe.">
          <label className="app-label">
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
            className="app-select"
          >
            <option value={0}>Select a cookbook</option>
            {availableCookbooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </SectionCard>
        </div>
      ) : null}

      {importedRawText ? (
        <div className="mx-auto max-w-5xl">
        <SectionCard title="Imported recipe text" description="Use the original extracted text to compare against the generated draft.">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
              View imported recipe text
            </summary>
            <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-[var(--surface-soft)] p-4 text-xs whitespace-pre-wrap text-[var(--text-secondary)]">
              {importedRawText}
            </pre>
          </details>
        </SectionCard>
        </div>
      ) : null}

      {isDraftLoading ? (
        <p className="mx-auto max-w-5xl text-sm text-[var(--text-secondary)]">Loading completed job draft...</p>
      ) : null}

      <RecipeForm
        key={`${recipeData.name}-${recipeData.cookbook_id ?? 0}`}
        initialData={recipeData}
        onSubmit={handleCreate}
        submitLabel="Create Recipe"
        categories={cookbook?.categories}
      />
    </div>
  );
}
