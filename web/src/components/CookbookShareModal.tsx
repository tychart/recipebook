import { useEffect, useState } from "react";
import {
  getCookbook,
  shareCookbook,
  removeCookbookUser,
} from "../api/cookbooks";
import type { Cookbook as CookbookType } from "../../types/types";
import { AppButton } from "./ui/AppButton";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="app-panel w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 font-[var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
          Manage Cookbook Access
        </h2>

        <div className="flex flex-col items-center">
          <div
            id="link-sharing"
            className="mb-6 flex flex-row w-full items-center justify-center space-x-4"
          >
            <input
              readOnly
              value={shareUrl}
              className="app-input flex-1"
            />

            <AppButton onClick={copyLink} variant="primary">
              {linkCopied ? "Link Copied!" : "Copy Link"}
            </AppButton>
          </div>

          <div
            id="add-contributors-container"
            className="flex flex-col space-x-0 w-full mb-6"
          >
            <div className="w-full">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Users with Contributor Access:
              </p>
              {addedContributors.map((email) => (
                <div
                  key={email}
                  className="mb-2 flex items-center justify-between rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-soft)] p-3"
                >
                  <span className="text-sm">{email}</span>
                  <button
                    onClick={() => removeContributor(email)}
                    className="w-auto text-sm font-bold uppercase text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-200"
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
                className="app-input flex-1"
              />

              <AppButton
                onClick={addContributor}
                variant="primary"
                disabled={
                  !contributorsInput ||
                  addedContributors.includes(contributorsInput) ||
                  !validateEmail(contributorsInput)
                }
              >
                Add User
              </AppButton>
            </div>
          </div>

          <div
            id="add-viewers-container"
            className="flex flex-col space-x-0 w-full mb-6"
          >
            <div className="w-full">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Users with Viewer Access:
              </p>
              {addedViewers.map((email) => (
                <div
                  key={email}
                  className="mb-2 flex items-center justify-between rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-soft)] p-3"
                >
                  <span className="text-sm">{email}</span>
                  <button
                    onClick={() => removeViewer(email)}
                    className="w-auto text-sm font-bold uppercase text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-200"
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
                className="app-input flex-1"
              />

              <AppButton
                onClick={addViewer}
                variant="primary"
                disabled={
                  !viewersInput ||
                  addedViewers.includes(viewersInput) ||
                  !validateEmail(viewersInput)
                }
              >
                Add User
              </AppButton>
            </div>
          </div>

          <AppButton onClick={onClose} className="mt-4 w-full justify-center">
            Close
          </AppButton>
        </div>
      </div>
    </div>
  );
}
