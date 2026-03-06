import { useState } from "react";

type AdminShareModalProps = {
  recipeId: string;
  onClose: () => void;
};

export default function AdminShareModal({
  recipeId,
  onClose,
}: AdminShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [addedEmails, setAddedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const shareUrl = `${window.location.origin}/recipe/${recipeId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
  };

  const addEmail = () => {
    if (emailInput && !addedEmails.includes(emailInput)) {
      setAddedEmails([...addedEmails, emailInput]);
      setEmailInput("");
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const removeEmail = (email: string) => {
    setAddedEmails(addedEmails.filter((e) => e !== email));
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

          <div
            id="add-emails-container"
            className="flex flex-col space-x-2 align-center justify-center"
          >
            <div className="w-full">
              <p className="mb-2 pl-1 text-lg">Users with access:</p>
              {addedEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-gray-200 dark:bg-gray-100 mb-2 rounded-lg border-b"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="text-red-500"
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
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-75 h-11 rounded-lg px-4 py-2 bg-gray-50"
              />

              <button
                onClick={addEmail}
                className="px-4 py-2 bg-blue-500 rounded-lg"
                disabled={
                  !emailInput ||
                  addedEmails.includes(emailInput) ||
                  !validateEmail(emailInput)
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
