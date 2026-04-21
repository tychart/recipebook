import {
  deleteCookbook
} from "../api/cookbooks";
import { useNavigate } from "react-router-dom";
import { AppButton } from "./ui/AppButton";

type CookBookDeleteModalProps = {
  cookbookId: string;
  onClose: () => void;
};

export default function CookBookDeleteModal({
  cookbookId,
  onClose,
}: CookBookDeleteModalProps) {
  const navigate = useNavigate();

  const deleteCookbookModal = async () => {
    try {
      await deleteCookbook(Number(cookbookId));
    } catch (err) {
      console.error("Failed to delete cookbook", err);
    }
    navigate(`/cookbooks`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="app-panel w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center font-[var(--font-display)] text-2xl font-semibold text-rose-600 dark:text-rose-200">
          Are you sure you want to delete this cookbook?
        </h2>

        <div className="flex flex-col items-center text-center">
          <p className="mb-6 text-sm font-medium leading-6 text-[var(--text-secondary)]">
            Deleting this cookbook will also delete all recipes in this cookbook. This action is not reversible.
          </p>

          <div className="flex gap-4 w-full">
            <AppButton onClick={deleteCookbookModal} variant="danger" className="w-full justify-center">
              Delete anyways
            </AppButton>

            <AppButton onClick={onClose} className="w-full justify-center">
              Cancel
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
