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
  const preview = imageUrl || "";

  return (
    <div className="space-y-4 mb-6">
      <div className="relative flex min-h-64 max-h-[28rem] w-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-[var(--border-muted)] bg-[var(--surface-soft)]">
        {preview ? (
          <img
            src={preview}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-6 text-center text-sm text-[var(--text-muted)]">
            No image selected
          </span>
        )}

        {editable && (
          <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEditClick}
              className="app-button app-button-primary"
            >
              {preview ? "Edit" : "Add Image"}
            </button>

            {preview && (
              <button
                type="button"
                onClick={onRemoveClick}
                className="app-button app-button-ghost"
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
