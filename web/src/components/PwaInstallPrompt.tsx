import { Download } from "lucide-react";
import { useState } from "react";
import { usePwaInstallPrompt } from "../hooks/usePwaInstall";
import { AppButton } from "./ui/AppButton";

export default function PwaInstallPrompt() {
  const { canInstall, promptToInstall } = usePwaInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) {
    return null;
  }

  return (
    <div className="rounded-[1.4rem] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4 text-left">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Install RecipeBook
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        Add the app to your home screen for a cleaner, full-screen cooking experience.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <AppButton
          variant="primary"
          className="min-w-[8.75rem]"
          onClick={() => void promptToInstall()}
        >
          <Download className="size-4" aria-hidden />
          Install
        </AppButton>
        <AppButton variant="ghost" onClick={() => setDismissed(true)}>
          Not now
        </AppButton>
      </div>
    </div>
  );
}
