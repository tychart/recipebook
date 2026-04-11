import {
  deleteCookbook
} from "../api/cookbooks";
import { useNavigate } from "react-router-dom";

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#EEE9E0] dark:bg-gray-800 rounded-xl p-6 w-full max-w-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-red-500 text-center">
          Are you sure you want to delete this cookbook?
        </h2>

        <div className="flex flex-col items-center text-center">
          <p className="mb-4 font-bold">
            Deleting this cookbook will also delete all recipes in this cookbook. This action is not reversible.
          </p>

          <div className="flex gap-4 w-full">
            <button
              onClick={deleteCookbookModal}
              className="px-4 py-2 w-full bg-red-500 text-white rounded-lg"
            >
              Delete anyways
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 w-full border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
