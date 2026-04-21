import { useState, useEffect } from "react";
import { listCookbooks } from "../../api/cookbooks";
import { useAuth } from "../../context/AuthContext";
import type { Cookbook } from "../../../types/types";
import { AppButton } from "../ui/AppButton";

interface CopyRecipeDialogProps {
  recipeId: number;
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

  useEffect(() => {
    if (!isOpen) return;

    const loadCookbooks = async () => {
      try {
        setCookbooksLoading(true);
        const cookbooks = await listCookbooks(user?.id ?? 0);
        setAvailableCookbooks(cookbooks);
      } catch (err) {
        console.error("Failed to load cookbooks:", err);
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
      await onCopy(targetCookbookId);
      onClose();
    } catch (err) {
      console.error("Failed to copy recipe:", err);
      alert("Failed to copy recipe.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="app-panel max-h-[90vh] w-full max-w-md overflow-y-auto">
        
        <div className="mb-6">
          <h3 className="font-[var(--font-display)] text-2xl font-semibold leading-tight text-[var(--text-primary)]">
            Copy Recipe
          </h3>
        </div>

        <div className="space-y-6">
          <p className="text-[var(--text-secondary)]">
            Select a cookbook to copy this recipe to:
          </p>

          <div>
            <label className="app-label">
              Destination Cookbook
            </label>
            <select
              value={selectedCookbookId}
              onChange={(e) => setSelectedCookbookId(e.target.value)}
              disabled={cookbooksLoading || loading}
              className="app-select cursor-pointer appearance-none disabled:opacity-50"
              style={{ 
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'right 0.75rem center', 
                backgroundSize: '1rem' 
              }}
            >
              <option value="">Choose a cookbook...</option>
              {cookbooksLoading ? (
                <option disabled>Loading cookbooks...</option>
              ) : (
                availableCookbooks.map((cookbook) => (
                  <option key={cookbook.id} value={cookbook.id}>
                    {cookbook.name}
                  </option>
                ))
              )}
            </select>
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
      </div>
    </div>
  );
}
