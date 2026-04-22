import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Cookbook, RecipeInput } from "../../../types/types";
import { createRecipeWithImage } from "../../api/recipes";
import { enqueueImageJob, enqueueTextJob, getJob } from "../../api/jobs";
import { getCookbook, listCookbooks } from "../../api/cookbooks";
import RecipeForm from "../../components/recipe/RecipeForm";
import { useAuth } from "../../context/AuthContext";
import { EmptyState } from "../../components/ui/EmptyState";
import { AppButton } from "../../components/ui/AppButton";
import { AppSelect } from "../../components/ui/AppSelect";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatusBanner } from "../../components/ui/StatusBanner";
import { getWritableCookbooks, isWritableCookbookRole } from "../../lib/cookbookAccess";

type QueueNotice = {
  jobId: string;
  source: "text" | "image";
};

type CreateMode = "manual" | "image" | "text";

const LAST_SELECTED_COOKBOOK_KEY = "recipebook:new-recipe:last-cookbook";
const JOB_COOKBOOK_KEY_PREFIX = "recipebook:new-recipe:job:";

function buildInitialRecipeData(
  cookbookId: number | undefined,
  creatorId: number | undefined,
): RecipeInput {
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

function readSessionNumber(key: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  const value = Number(window.sessionStorage.getItem(key));
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function writeSessionNumber(key: string, value: number) {
  if (typeof window === "undefined") {
    return;
  }

  if (value > 0) {
    window.sessionStorage.setItem(key, String(value));
    return;
  }

  window.sessionStorage.removeItem(key);
}

function removeSessionKey(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(key);
}

export default function RecipeNew() {
  const { cookbookId } = useParams<{ cookbookId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const parsedCookbookId = cookbookId ? Number(cookbookId) : undefined;
  const numericCookbookId =
    parsedCookbookId !== undefined && !Number.isNaN(parsedCookbookId)
      ? parsedCookbookId
      : undefined;
  const jobId = searchParams.get("job");
  const isGlobalCreate = numericCookbookId === undefined;

  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [writableCookbooks, setWritableCookbooks] = useState<Cookbook[]>([]);
  const [isCookbookLoading, setIsCookbookLoading] = useState(Boolean(numericCookbookId));
  const [isCookbookOptionsLoading, setIsCookbookOptionsLoading] = useState(isGlobalCreate);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("manual");
  const [textImportValue, setTextImportValue] = useState("");
  const [imageImportValue, setImageImportValue] = useState("");
  const [queueNotice, setQueueNotice] = useState<QueueNotice | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [importedRawText, setImportedRawText] = useState("");
  const [manualTagInput, setManualTagInput] = useState("");
  const [manualSelectedImageFile, setManualSelectedImageFile] = useState<File>();
  const [manualOriginalImageUrl, setManualOriginalImageUrl] = useState("");
  const [selectedCookbookId, setSelectedCookbookId] = useState<number>(
    numericCookbookId ?? 0,
  );
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imagePickerRef = useRef<HTMLInputElement>(null);

  const [recipeData, setRecipeData] = useState<RecipeInput>(() =>
    buildInitialRecipeData(numericCookbookId, user?.id),
  );

  useEffect(() => {
    setRecipeData((prev) => ({
      ...prev,
      creator_id: user?.id || 0,
      cookbook_id: numericCookbookId ?? prev.cookbook_id ?? 0,
    }));
  }, [numericCookbookId, user?.id]);

  useEffect(() => {
    if (!numericCookbookId) {
      setCookbook(null);
      setIsCookbookLoading(false);
      setAccessError(null);
      return;
    }

    let active = true;
    setIsCookbookLoading(true);
    setAccessError(null);

    getCookbook(numericCookbookId)
      .then((data) => {
        if (!active) return;
        setCookbook(data);
        if (!isWritableCookbookRole(data.current_user_role)) {
          setAccessError("You need owner or contributor access to add recipes to this cookbook.");
        }
      })
      .catch((error) => {
        console.error("Failed to fetch cookbook", error);
        if (active) {
          setAccessError("Failed to load that cookbook.");
        }
      })
      .finally(() => {
        if (active) {
          setIsCookbookLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [numericCookbookId]);

  useEffect(() => {
    if (!user || !isGlobalCreate) {
      setWritableCookbooks([]);
      setIsCookbookOptionsLoading(false);
      return;
    }

    let active = true;
    setIsCookbookOptionsLoading(true);

    listCookbooks(user.id)
      .then((cookbooks) => {
        if (!active) return;

        const nextWritableCookbooks = getWritableCookbooks(cookbooks);
        setWritableCookbooks(nextWritableCookbooks);

        const rememberedJobCookbookId = jobId
          ? readSessionNumber(`${JOB_COOKBOOK_KEY_PREFIX}${jobId}`)
          : 0;
        const rememberedCookbookId = readSessionNumber(LAST_SELECTED_COOKBOOK_KEY);

        setSelectedCookbookId((currentSelectedCookbookId) => {
          if (
            rememberedJobCookbookId > 0 &&
            nextWritableCookbooks.some((book) => book.id === rememberedJobCookbookId)
          ) {
            return rememberedJobCookbookId;
          }

          if (
            currentSelectedCookbookId > 0 &&
            nextWritableCookbooks.some((book) => book.id === currentSelectedCookbookId)
          ) {
            return currentSelectedCookbookId;
          }

          if (nextWritableCookbooks.length === 1) {
            return nextWritableCookbooks[0].id;
          }

          if (
            rememberedCookbookId > 0 &&
            nextWritableCookbooks.some((book) => book.id === rememberedCookbookId)
          ) {
            return rememberedCookbookId;
          }

          return 0;
        });
      })
      .catch((error) => {
        console.error("Failed to fetch cookbooks", error);
        if (active) {
          setWritableCookbooks([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsCookbookOptionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isGlobalCreate, jobId, user]);

  useEffect(() => {
    if (!isGlobalCreate) {
      return;
    }

    writeSessionNumber(LAST_SELECTED_COOKBOOK_KEY, selectedCookbookId);
  }, [isGlobalCreate, selectedCookbookId]);

  useEffect(() => {
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

        const result = job.result;
        const nextRecipeCookbookId = numericCookbookId ?? 0;
        const nextRecipeData = {
          ...result.draft,
          creator_id: user.id,
          cookbook_id: nextRecipeCookbookId,
        };

        setImportedRawText(result.raw_text);
        setCreateMode("manual");
        setRecipeData((prev) => ({
          ...prev,
          ...nextRecipeData,
          cookbook_id: numericCookbookId ?? prev.cookbook_id ?? 0,
        }));
        setManualTagInput(nextRecipeData.tags?.join(", ") ?? "");
        setManualSelectedImageFile(undefined);
        setManualOriginalImageUrl("");
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
  }, [jobId, numericCookbookId, user]);

  const hasWritableCookbooks = writableCookbooks.length > 0;
  const canCreateInCurrentCookbook = numericCookbookId
    ? Boolean(cookbook && isWritableCookbookRole(cookbook.current_user_role))
    : hasWritableCookbooks;
  const needsGlobalCookbookSelection = isGlobalCreate && selectedCookbookId === 0;
  const isPageLoading = isCookbookLoading || (isGlobalCreate && isCookbookOptionsLoading);

  const globalCookbookPlaceholder = useMemo(() => {
    if (writableCookbooks.length === 1) {
      return writableCookbooks[0].name;
    }

    return "Select a cookbook";
  }, [writableCookbooks]);
  const showGlobalCookbookPlaceholder = writableCookbooks.length !== 1;
  const cookbookOptions = useMemo(
    () => writableCookbooks.map((book) => ({ value: String(book.id), label: book.name })),
    [writableCookbooks],
  );

  const blockedActions = (
    <>
      <Link to="/cookbooks/new">
        <AppButton variant="primary">Create Cookbook</AppButton>
      </Link>
      <Link to={numericCookbookId ? `/cookbook/${numericCookbookId}` : "/cookbooks"}>
        <AppButton>Back to Cookbooks</AppButton>
      </Link>
    </>
  );

  if (!user) {
    return <p>Please log in to create a recipe.</p>;
  }

  if (cookbookId && numericCookbookId === undefined) {
    return (
      <div className="space-y-6 py-6">
        <PageHeader
          eyebrow="Create"
          title="New Recipe"
          description="Recipe creation needs a valid cookbook destination."
        />
        <EmptyState
          title="That cookbook link is not valid."
          description="Head back to your library and start a new recipe from a cookbook that you can edit."
          actions={blockedActions}
        />
      </div>
    );
  }

  const persistQueuedCookbookDestination = (queuedJobId: string) => {
    if (isGlobalCreate && selectedCookbookId > 0) {
      writeSessionNumber(`${JOB_COOKBOOK_KEY_PREFIX}${queuedJobId}`, selectedCookbookId);
    }
  };

  const queueImageImport = async (file: File, resetInput: () => void) => {
    if (isGlobalCreate && selectedCookbookId === 0) {
      setActionError("Choose a cookbook before queueing an image import.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    setDraftError(null);
    setQueueNotice(null);

    try {
      const queuedJob = await enqueueImageJob(file, imageImportValue);
      persistQueuedCookbookDestination(queuedJob.job_id);
      setQueueNotice({ jobId: queuedJob.job_id, source: "image" });
      setImageImportValue("");
    } catch (error) {
      console.error("Image enqueue error:", error);
      setActionError("Failed to queue image import.");
    } finally {
      setIsProcessing(false);
      resetInput();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await queueImageImport(file, () => {
      event.target.value = "";
    });
  };

  const handleTextImport = async () => {
    if (!textImportValue.trim()) {
      return;
    }

    if (isGlobalCreate && selectedCookbookId === 0) {
      setActionError("Choose a cookbook before queueing a text import.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    setDraftError(null);
    setQueueNotice(null);

    try {
      const queuedJob = await enqueueTextJob(textImportValue);
      persistQueuedCookbookDestination(queuedJob.job_id);
      setQueueNotice({ jobId: queuedJob.job_id, source: "text" });
      setTextImportValue("");
    } catch (error) {
      console.error("Text import enqueue error:", error);
      setActionError("Failed to queue recipe text.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreate = async (recipeInput: RecipeInput, imageFile?: File) => {
    const cookbookChoice = numericCookbookId ?? selectedCookbookId;
    if (!cookbookChoice) {
      setActionError("Please choose a cookbook before creating the recipe.");
      return;
    }

    try {
      setActionError(null);
      const result = await createRecipeWithImage(
        {
          ...recipeInput,
          cookbook_id: cookbookChoice,
          creator_id: user.id,
        },
        imageFile,
      );

      if (jobId) {
        removeSessionKey(`${JOB_COOKBOOK_KEY_PREFIX}${jobId}`);
      }

      navigate(`/recipe/${result.recipe.id}`);
    } catch (error) {
      console.error("Failed to create recipe", error);
      setActionError("Failed to create recipe.");
    }
  };

  const renderModeButton = (
    mode: CreateMode,
    title: string,
    description: string,
  ) => {
    const isActive = createMode === mode;

    return (
      <button
        key={mode}
        type="button"
        onClick={() => setCreateMode(mode)}
        className={`flex min-w-0 flex-1 flex-col items-start rounded-[1.25rem] px-4 py-3 text-left transition ${
          isActive
            ? "border border-[var(--interactive-border)] bg-[var(--interactive-soft)] text-[var(--text-primary)] shadow-sm"
            : "border border-transparent text-[var(--text-secondary)] hover:border-[var(--border-muted)] hover:bg-[var(--surface)]"
        }`}
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="mt-1 text-xs leading-5">{description}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        eyebrow="Create"
        title="New Recipe"
        description={
          numericCookbookId
            ? `Adding to ${cookbook ? cookbook.name : "this cookbook"} with a polished recipe flow for manual entry or quick imports.`
            : "Start from scratch, import from an image, or paste recipe text into a draft that feels good on phone and desktop."
        }
        actions={
          <Link to={numericCookbookId ? `/cookbook/${numericCookbookId}` : "/cookbooks"}>
            <AppButton variant="ghost">Cancel</AppButton>
          </Link>
        }
      />

      <input
        type="file"
        ref={cameraInputRef}
        onChange={(event) => void handleImageUpload(event)}
        className="hidden"
        accept="image/*"
        capture="environment"
      />
      <input
        type="file"
        ref={imagePickerRef}
        onChange={(event) => void handleImageUpload(event)}
        className="hidden"
        accept="image/*"
      />

      {isPageLoading ? (
        <p className="mx-auto max-w-5xl text-sm text-[var(--text-secondary)]">
          Loading recipe creation options...
        </p>
      ) : null}

      {!isPageLoading && !canCreateInCurrentCookbook ? (
        <div className="mx-auto w-full max-w-5xl">
          <EmptyState
            title="Recipe creation is not available yet."
            description={
              accessError ??
              "You need owner or contributor access to at least one cookbook before starting a new recipe."
            }
            actions={blockedActions}
          />
        </div>
      ) : (
        <>
          {isGlobalCreate ? (
            <div className="mx-auto max-w-5xl">
              <SectionCard
                title="Save destination"
                description="Choose the cookbook that should own this recipe. Imports and manual saves stay tied to this choice for the current session."
              >
                <label className="app-label">Save to cookbook</label>
                <AppSelect
                  value={selectedCookbookId > 0 ? String(selectedCookbookId) : ""}
                  onValueChange={(nextValue) => setSelectedCookbookId(Number(nextValue))}
                  options={cookbookOptions}
                  placeholder={showGlobalCookbookPlaceholder ? globalCookbookPlaceholder : undefined}
                  ariaLabel="Save to cookbook"
                />
                {needsGlobalCookbookSelection ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    Pick a cookbook before you queue an import or save a new recipe so nothing gets stranded at the end.
                  </p>
                ) : null}
              </SectionCard>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl">
              <p className="text-sm text-[var(--text-secondary)]">
                Adding to: {cookbook ? cookbook.name : "Loading cookbook..."}
              </p>
            </div>
          )}

          <div className="mx-auto max-w-5xl">
            <SectionCard
              title="How do you want to start?"
              description="Switch between manual entry, image import, and text import without cluttering the form."
            >
              <div className="rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-1">
                <div className="grid gap-1 sm:grid-cols-3">
                  {renderModeButton(
                    "manual",
                    "Manual",
                    "Type everything in yourself and attach an image later if you want.",
                  )}
                  {renderModeButton(
                    "image",
                    "Image",
                    "Queue a photo, screenshot, or scan using quick browser-native image picking.",
                  )}
                  {renderModeButton(
                    "text",
                    "Text",
                    "Paste copied text from a website, note, or message and let the parser draft it.",
                  )}
                </div>
              </div>

              {createMode === "manual" ? (
                <div className="mt-5 rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] px-5 py-5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Manual entry is ready.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    The full recipe form is just below. Add an image later from the editor if you want to include a cover photo.
                  </p>
                </div>
              ) : null}

              {createMode === "image" ? (
                <div className="mt-5 space-y-4 rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] px-5 py-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Import from a recipe photo, screenshot, or scan.
                    </p>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">
                      Use a quick camera capture on mobile or choose an existing image from your device. The importer will queue in the background and show up in Jobs.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <AppButton
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isProcessing || needsGlobalCookbookSelection}
                      variant="primary"
                    >
                      {isProcessing ? "Queueing..." : "Take Photo"}
                    </AppButton>
                    <AppButton
                      onClick={() => imagePickerRef.current?.click()}
                      disabled={isProcessing || needsGlobalCookbookSelection}
                    >
                      Choose Image
                    </AppButton>
                  </div>

                  <details className="rounded-[1.25rem] border border-[var(--border-muted)] bg-[var(--surface)] px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
                      Optional import notes
                    </summary>
                    <div className="mt-4">
                      <label className="app-label">Optional image import notes</label>
                      <textarea
                        value={imageImportValue}
                        onChange={(event) => setImageImportValue(event.target.value)}
                        placeholder="Add a missing title, clarify handwriting, or explain anything the image does not show clearly..."
                        className="app-textarea"
                      />
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        These notes are sent only during image extraction and are kept with the queued job for debugging.
                      </p>
                    </div>
                  </details>
                </div>
              ) : null}

              {createMode === "text" ? (
                <div className="mt-5 space-y-4 rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] px-5 py-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Paste recipe text into a draft.
                    </p>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">
                      Great for blog excerpts, family texts, copied recipe cards, or quick OCR cleanup before you review the generated draft.
                    </p>
                  </div>

                  <div>
                    <label className="app-label">Paste recipe text</label>
                    <textarea
                      value={textImportValue}
                      onChange={(event) => setTextImportValue(event.target.value)}
                      placeholder="Paste a recipe, blog excerpt, or handwritten transcription here..."
                      className="app-textarea min-h-48"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <AppButton
                      onClick={() => void handleTextImport()}
                      disabled={isProcessing || !textImportValue.trim() || needsGlobalCookbookSelection}
                      variant="primary"
                    >
                      {isProcessing ? "Queueing..." : "Queue Text Import"}
                    </AppButton>
                    <AppButton
                      onClick={() => setTextImportValue("")}
                      disabled={isProcessing || !textImportValue}
                    >
                      Clear Text
                    </AppButton>
                  </div>
                </div>
              ) : null}
            </SectionCard>
          </div>

          {queueNotice ? (
            <div className="mx-auto max-w-5xl">
              <StatusBanner tone="success" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {queueNotice.source === "image" ? "Image import queued." : "Text import queued."}
                  </p>
                  <p className="mt-1">
                    The background worker is processing your recipe now. You can keep editing manually or head to Jobs to watch it finish.
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

          {actionError ? (
            <div className="mx-auto max-w-5xl">
              <StatusBanner tone="danger">{actionError}</StatusBanner>
            </div>
          ) : null}

          {importedRawText ? (
            <div className="mx-auto max-w-5xl">
              <SectionCard
                title="Imported recipe text"
                description="Use the original extracted text to compare against the generated draft."
              >
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
            <p className="mx-auto max-w-5xl text-sm text-[var(--text-secondary)]">
              Loading completed job draft...
            </p>
          ) : null}

          {createMode === "manual" ? (
            <RecipeForm
              recipe={recipeData}
              onRecipeChange={setRecipeData}
              tagInput={manualTagInput}
              onTagInputChange={setManualTagInput}
              selectedImageFile={manualSelectedImageFile}
              onSelectedImageFileChange={setManualSelectedImageFile}
              originalImageUrl={manualOriginalImageUrl}
              onSubmit={handleCreate}
              submitLabel="Create Recipe"
              submitDisabled={needsGlobalCookbookSelection}
              submitHint={
                needsGlobalCookbookSelection
                  ? "Choose a cookbook above before saving this recipe."
                  : undefined
              }
              categories={cookbook?.categories}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
