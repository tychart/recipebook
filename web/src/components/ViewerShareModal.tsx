import { useState } from "react";

type ViewShareModalProps = {
  recipeId: string;
  onClose: () => void;
};

export default function ViewerShareModal({
  recipeId,
  onClose,
}: ViewShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `${window.location.origin}/recipe/${recipeId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#EEE9E0] dark:bg-gray-800 rounded-xl p-6 w-125 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Share Recipe</h2>

        <div className="flex flex-col items-center">
          <div
            id="link-sharing"
            className="mb-4 flex flex-row w-full items-center justify-center space-x-4"
          >
            <input
              readOnly
              value={shareUrl}
              className="w-75 h-11 rounded-lg px-4 py-2 bg-gray-50"
            />

            <button
              onClick={copyLink}
              className="px-4 py-2 bg-blue-500 rounded-lg"
            >
              {linkCopied ? "Link Copied!" : "Copy Link"}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg mt-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
