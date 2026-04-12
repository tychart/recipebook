import { useEffect, useState } from "react";
import {
  getCookbook,
  shareCookbook,
  removeCookbookUser,
} from "../api/cookbooks";
import type { Cookbook as CookbookType } from "../../types/types";
import { useBorderTheme } from "../context/BorderThemeContext";
import { sidebarActiveNavClasses } from "../theme/borderTheme";


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

  const { borderTheme } = useBorderTheme();
  const primaryButtonClass = sidebarActiveNavClasses[borderTheme];

  const shareUrl = `${window.location.origin}/cookbook/${cookbookId}`;

  useEffect(() => {
    const loadCookbook = async () => {
      try {
        const data = await getCookbook(Number(cookbookId));
        setCookbook(data);
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
    setTimeout(() => setLinkCopied(false), 2000);
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
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border border-black rounded-xl p-6 w-full max-w-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-6">Manage Cookbook Access</h2>

        <div className="flex flex-col items-center">
          <div
            id="link-sharing"
            className="mb-6 flex flex-row w-full items-center justify-center space-x-4"
          >
            <input
              readOnly
              value={shareUrl}
              className="flex-1 h-11 rounded-lg px-4 py-2 border border-black/10 bg-stone-50 focus:outline-none"
            />

            <button 
              onClick={copyLink} 
              className={`px-4 py-2 w-auto rounded-lg font-medium transition border shadow-sm ${primaryButtonClass}`}
            >
              {linkCopied ? "Link Copied!" : "Copy Link"}
            </button>
          </div>

          <div
            id="add-contributors-container"
            className="flex flex-col space-x-0 w-full mb-6"
          >
            <div className="w-full">
              <p className="mb-2 text-xs uppercase tracking-wide font-bold text-stone-500">
                Users with Contributor Access:
              </p>
              {addedContributors.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 bg-stone-50 mb-2 rounded-lg border border-black/10"
                >
                  <span className="text-sm">{email}</span>
                  <button
                    onClick={() => removeContributor(email)}
                    className="text-red-600 text-sm font-bold uppercase hover:text-red-700 transition-colors w-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-row space-x-4 mt-2">
              <input
                type="email"
                placeholder="Add email addresses"
                value={contributorsInput}
                onChange={(e) => setContributorsInput(e.target.value)}
                className="flex-1 h-11 rounded-lg px-4 py-2 border border-black bg-white focus:outline-none"
              />

              <button
                onClick={addContributor}
                className={`px-4 py-2 w-auto rounded-lg font-medium border shadow-sm transition disabled:opacity-50 ${primaryButtonClass}`}
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
            className="flex flex-col space-x-0 w-full mb-6"
          >
            <div className="w-full">
              <p className="mb-2 text-xs uppercase tracking-wide font-bold text-stone-500">
                Users with Viewer Access:
              </p>
              {addedViewers.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 bg-stone-50 mb-2 rounded-lg border border-black/10"
                >
                  <span className="text-sm">{email}</span>
                  <button
                    onClick={() => removeViewer(email)}
                    className="text-red-600 text-sm font-bold uppercase hover:text-red-700 transition-colors w-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-row space-x-4 mt-2">
              <input
                type="email"
                placeholder="Add email addresses"
                value={viewersInput}
                onChange={(e) => setViewersInput(e.target.value)}
                className="flex-1 h-11 rounded-lg px-4 py-2 border border-black bg-white focus:outline-none"
              />

              <button
                onClick={addViewer}
                className={`px-4 py-2 w-auto rounded-lg font-medium border shadow-sm transition disabled:opacity-50 ${primaryButtonClass}`}
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
            className="w-full px-4 py-2 border border-black rounded-lg mt-4 bg-white text-black hover:bg-stone-100 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}