import { useState, useEffect } from "react";

interface RecipeImageProps {
  imageUrl?: string;
  editable?: boolean;
  alt?: string;
  onEditClick?: () => void;
  onRemoveClick?: () => void;
}

export default function RecipeImage({
  imageUrl,
  editable = false,
  alt = "Recipe Image",
  onEditClick,
  onRemoveClick,
}: RecipeImageProps) {
  const [preview, setPreview] = useState(imageUrl || "");

  useEffect(() => {
    setPreview(imageUrl || "");
  }, [imageUrl]);

  return (
    <div className="space-y-4 mb-6">
      <div className="relative w-full min-h-48 max-h-80 overflow-hidden rounded-xl border border-stone-300 bg-stone-100 flex items-center justify-center">
        {preview ? (
          <img
            src={preview}
            alt={alt}
            className="w-full max-h-80 object-contain rounded-xl"
          />
        ) : (
          <span className="text-stone-400 text-center">
            No image selected
          </span>
        )}

        {editable && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={onEditClick}
              className="px-3 py-1 text-sm bg-red-500 text-black rounded-lg shadow hover:bg-red-600"
            >
              {preview ? "Edit" : "Add Image"}
            </button>

            {preview && (
              <button
                type="button"
                onClick={onRemoveClick}
                className="px-3 py-1 text-sm bg-red-500 text-black rounded-lg shadow hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}