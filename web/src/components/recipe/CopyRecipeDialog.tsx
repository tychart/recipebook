import { useEffect, useState } from "react";
import { listCookbooks } from "../../api/cookbooks";
import { useAuth } from "../../context/AuthContext";
import type { Cookbook } from "../../../types/types";
import { AppButton } from "../ui/AppButton";
import { AppModal } from "../ui/AppModal";
import { AppSelect } from "../ui/AppSelect";
import { StatusBanner } from "../ui/StatusBanner";
import { getWritableCookbooks } from "../../lib/cookbookAccess";

interface CopyRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (cookbookId: number) => Promise<void>;
}

export default function CopyRecipeDialog({
  isOpen,
  onClose,
  onCopy,
}: CopyRecipeDialogProps) {
  const { user } = useAuth();
  const [availableCookbooks, setAvailableCookbooks] = useState<Cookbook[]>([]);
  const [selectedCookbookId, setSelectedCookbookId] = useState("");
  const [loading, setLoading] = useState(false);
  const [cookbooksLoading, setCookbooksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const titleId = "copy-recipe-dialog-title";
  const cookbookOptions = availableCookbooks.map((cookbook) => ({
    value: String(cookbook.id),
    label: cookbook.name,
  }));

  useEffect(() => {
    if (!isOpen) return;

    const loadCookbooks = async () => {
      try {
        setCookbooksLoading(true);
        const cookbooks = await listCookbooks(user?.id ?? 0);
        setAvailableCookbooks(getWritableCookbooks(cookbooks));
        setError(null);
      } catch (err) {
        console.error("Failed to load cookbooks:", err);
        setError("Failed to load cookbook destinations.");
      } finally {
        setCookbooksLoading(false);
      }
    };

    loadCookbooks();
  }, [isOpen, user]);

  const handleCopy = async () => {
    const targetCookbookId = Number(selectedCookbookId);
    if (!selectedCookbookId || Number.isNaN(targetCookbookId)) return;

    try {
      setLoading(true);
      setError(null);
      await onCopy(targetCookbookId);
      onClose();
    } catch (err) {
      console.error("Failed to copy recipe:", err);
      setError("Failed to copy recipe.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AppModal
      onClose={onClose}
      labelledBy={titleId}
      panelClassName="app-panel w-full max-w-md"
    >
      <div className="mb-6">
        <h3
          id={titleId}
          className="font-[var(--font-display)] text-2xl font-semibold leading-tight text-[var(--text-primary)]"
        >
          Copy Recipe
        </h3>
      </div>

      <div className="space-y-6">
        <p className="text-[var(--text-secondary)]">
          Select a cookbook to copy this recipe to:
        </p>

        {error ? (
          <StatusBanner tone="danger" role="alert">
            {error}
          </StatusBanner>
        ) : null}

        <div>
          <label className="app-label">
            Destination Cookbook
          </label>
          <AppSelect
            value={selectedCookbookId}
            onValueChange={setSelectedCookbookId}
            disabled={cookbooksLoading || loading}
            options={cookbookOptions}
            placeholder={cookbooksLoading ? "Loading cookbooks..." : "Choose a cookbook..."}
            ariaLabel="Destination cookbook"
          />
          {!cookbooksLoading && availableCookbooks.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              You need owner or contributor access to another cookbook before you can copy this recipe.
            </p>
          ) : null}
        </div>

        <div className="flex gap-3 pt-2">
          <AppButton
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 justify-center"
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            onClick={handleCopy}
            disabled={!selectedCookbookId || loading || cookbooksLoading}
            variant="primary"
            className="flex-1 justify-center"
          >
            {loading ? "Copying..." : "Copy Recipe"}
          </AppButton>
        </div>
      </div>
    </AppModal>
  );
}
