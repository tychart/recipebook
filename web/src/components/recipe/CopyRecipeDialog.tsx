import { useState, useEffect } from "react";
import { listCookbooks } from "../../api/cookbooks";
import { useAuth } from "../../context/AuthContext";
import { useBorderTheme } from "../../context/BorderThemeContext";
import type { Cookbook } from "../../../types/types";
import { sidebarActiveNavClasses } from "../../theme/borderTheme";

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
  const { borderTheme } = useBorderTheme();
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

  const primaryButtonClass = sidebarActiveNavClasses[borderTheme];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white border border-black rounded-[10px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        
        <div className="mb-6">
          <h3 className="text-2xl font-semibold leading-tight">Copy Recipe</h3>
        </div>

        <div className="space-y-6">
          <p className="text-gray-600">
            Select a cookbook to copy this recipe to:
          </p>

          <div>
            <label className="block text-xs uppercase tracking-wide font-bold mb-2 text-stone-500">
              Destination Cookbook
            </label>
            <select
              value={selectedCookbookId}
              onChange={(e) => setSelectedCookbookId(e.target.value)}
              disabled={cookbooksLoading || loading}
              className="w-full h-11 rounded-md border border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black/10 disabled:opacity-50 appearance-none transition-all cursor-pointer"
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition border border-black bg-white text-black hover:bg-stone-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!selectedCookbookId || loading || cookbooksLoading}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition border disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${primaryButtonClass}`}
            >
              {loading ? "Copying..." : "Copy Recipe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}