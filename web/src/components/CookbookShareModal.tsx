import { useEffect, useState } from "react";
import {
  getCookbook,
  shareCookbook,
  removeCookbookUser,
} from "../api/cookbooks";
import type { Cookbook as CookbookType } from "../../types/types";

type CookbookShareModalProps = {
  cookbookId: string;
  onClose: () => void;
};

export default function CookbookShareModal({
  cookbookId,
  onClose,
}: CookbookShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [addedContributors, setAddedContributors] = useState<string[]>([]);
  const [addedViewers, setAddedViewers] = useState<string[]>([]);
  const [contributorsInput, setContributorsInput] = useState("");
  const [viewersInput, setViewersInput] = useState("");
  const [cookbook, setCookbook] = useState<CookbookType | null>(null);
  const [, setLoading] = useState(true);

  // TODO: Populate viewers and contributors with actual database values
  // TODO: Make API calls to add users as either contributors or viewers, and to remove them as well

  const shareUrl = `${window.location.origin}/cookbook/${cookbookId}`;

  // Fetch cookbook data on mount
  useEffect(() => {
    const loadCookbook = async () => {
      try {
        const data = await getCookbook(Number(cookbookId));
        setCookbook(data);

        // Populate contributors and viewers from API response
        setAddedContributors(data.contributors?.map((c: any) => c.email) || []);
        setAddedViewers(data.viewers?.map((v: any) => v.email) || []);
      } catch (err) {
        console.error("Failed to load cookbook sharing data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCookbook();
  }, [cookbookId]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
  };

  const addContributor = async () => {
    if (!contributorsInput || addedContributors.includes(contributorsInput))
      return;

    try {
      await shareCookbook({
        book_id: Number(cookbookId),
        email: contributorsInput.trim(),
        role: "contributor",
      });

      setAddedContributors([...addedContributors, contributorsInput.trim()]);
      setContributorsInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to add contributor");
    }
  };

  const addViewer = async () => {
    if (!viewersInput || addedViewers.includes(viewersInput)) return;

    try {
      await shareCookbook({
        book_id: Number(cookbookId),
        email: viewersInput.trim(),
        role: "viewer",
      });

      setAddedViewers([...addedViewers, viewersInput.trim()]);
      setViewersInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to add viewer");
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const removeContributor = async (email: string) => {
    if (!cookbook?.contributors) return;

    const contributor = cookbook.contributors.find((c) => c.email === email);
    if (!contributor) return;

    try {
      await removeCookbookUser({
        book_id: Number(cookbookId),
        user_id: contributor.user_id,
      });

      setAddedContributors((prev) => prev.filter((e) => e !== email));
    } catch (err) {
      console.error("Failed to remove contributor:", err);
      alert("Failed to remove contributor");
    }
  };

  const removeViewer = async (email: string) => {
    if (!cookbook?.viewers) return;

    const viewer = cookbook.viewers.find((v) => v.email === email);
    if (!viewer) return;

    try {
      await removeCookbookUser({
        book_id: Number(cookbookId),
        user_id: viewer.user_id,
      });

      setAddedViewers((prev) => prev.filter((e) => e !== email));
    } catch (err) {
      console.error("Failed to remove viewer:", err);
      alert("Failed to remove viewer");
    }
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
        <h2 className="text-xl font-semibold mb-4">Manage Cookbook Access</h2>

        <div className="flex flex-col items-center">
          <div
            id="link-sharing"
            className="mb-4 flex flex-row w-full items-center justify-center space-x-4"
          >
            <input
              readOnly
              value={shareUrl}
              className="flex-1 h-11 rounded-lg px-4 py-2 bg-gray-50"
            />

            <button onClick={copyLink} className="px-4 py-2 w-auto rounded-lg">
              {linkCopied ? "Link Copied!" : "Copy Link"}
            </button>
          </div>

          <div
            id="add-contributors-container"
            className="flex flex-col space-x-2 align-center justify-center mb-4"
          >
            <div className="w-full">
              <p className="mb-2 pl-1 text-lg">
                Users with Contributor Access:
              </p>
              {addedContributors.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-gray-200 dark:bg-gray-100 mb-2 rounded-lg border-b"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => removeContributor(email)}
                    className="text-red-500 w-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-row space-x-4">
              <input
                type="email"
                placeholder="Add email addresses"
                value={contributorsInput}
                onChange={(e) => setContributorsInput(e.target.value)}
                className="flex-1 h-11 rounded-lg px-4 py-2 bg-gray-50"
              />

              <button
                onClick={addContributor}
                className="px-4 py-2 w-auto rounded-lg"
                disabled={
                  !contributorsInput ||
                  addedContributors.includes(contributorsInput) ||
                  !validateEmail(contributorsInput)
                }
              >
                Add User
              </button>
            </div>
          </div>

          <div
            id="add-viewers-container"
            className="flex flex-col space-x-2 align-center justify-center"
          >
            <div className="w-full">
              <p className="mb-2 pl-1 text-lg">Users with Viewer Access:</p>
              {addedViewers.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-gray-200 dark:bg-gray-100 mb-2 rounded-lg border-b"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => removeViewer(email)}
                    className="text-red-500 w-30"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-row space-x-4">
              <input
                type="email"
                placeholder="Add email addresses"
                value={viewersInput}
                onChange={(e) => setViewersInput(e.target.value)}
                className="w-75 h-11 rounded-lg px-4 py-2 bg-gray-50"
              />

              <button
                onClick={addViewer}
                className="px-4 py-2 w-30 rounded-lg"
                disabled={
                  !viewersInput ||
                  addedViewers.includes(viewersInput) ||
                  !validateEmail(viewersInput)
                }
              >
                Add User
              </button>
            </div>
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
