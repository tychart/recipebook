import { useState } from "react";
import { useBorderTheme } from "../context/BorderThemeContext";
import { sidebarActiveNavClasses } from "../theme/borderTheme";

type RecipeShareModalProps = {
  recipeId: string;
  onClose: () => void;
};

export default function RecipeShareModal({
  recipeId,
  onClose,
}: RecipeShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const { borderTheme } = useBorderTheme();

  const shareUrl = `${window.location.origin}/recipe/${recipeId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    // Reset "Copied" text after 2 seconds
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const primaryButtonClass = sidebarActiveNavClasses[borderTheme];

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-black rounded-[10px] p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h3 className="text-2xl font-semibold leading-tight">Share Recipe</h3>
        </div>

        <div className="space-y-6">
          <p className="text-gray-600">
            Copy the link below to share this recipe with others:
          </p>

          <div>
            <label className="block text-xs uppercase tracking-wide font-bold mb-2 text-stone-500">
              Recipe Link
            </label>
            <input
              readOnly
              value={shareUrl}
              className="w-full h-11 rounded-md border border-black bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black/10 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition border border-black bg-white text-black hover:bg-stone-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copyLink}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition border shadow-sm ${primaryButtonClass}`}
            >
              {linkCopied ? "Link Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}