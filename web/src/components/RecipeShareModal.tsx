import { useState } from "react";
import { AppButton } from "./ui/AppButton";

type RecipeShareModalProps = {
  recipeId: string;
  onClose: () => void;
};

export default function RecipeShareModal({
  recipeId,
  onClose,
}: RecipeShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `${window.location.origin}/recipe/${recipeId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="app-panel w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h3 className="font-[var(--font-display)] text-2xl font-semibold leading-tight text-[var(--text-primary)]">
            Share Recipe
          </h3>
        </div>

        <div className="space-y-6">
          <p className="text-[var(--text-secondary)]">
            Copy the link below to share this recipe with others:
          </p>

          <div>
            <label className="app-label">
              Recipe Link
            </label>
            <input
              readOnly
              value={shareUrl}
              className="app-input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <AppButton type="button" onClick={onClose} className="flex-1 justify-center">
              Close
            </AppButton>
            <AppButton
              type="button"
              onClick={copyLink}
              variant="primary"
              className="flex-1 justify-center"
            >
              {linkCopied ? "Link Copied!" : "Copy Link"}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
