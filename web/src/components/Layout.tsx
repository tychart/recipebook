import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarContent } from "./SidebarContent";
import { SidebarShell } from "./SidebarShell";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Close drawer on browser back/forward and any navigation that skips our Links.
    queueMicrotask(() => setMobileNavOpen(false));
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [mobileNavOpen]);

  if (user) {
    return (
      <div className="relative flex min-h-0 h-full w-full flex-1 flex-col gap-4 p-3 md:flex-row md:p-4">
        <header className="app-panel no-print flex min-h-[4.75rem] shrink-0 items-center gap-3 px-3 py-2 md:hidden">
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-soft)] text-[var(--text-primary)]"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={
              mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
            }
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? (
              <X className="size-6" strokeWidth={2} aria-hidden />
            ) : (
              <Menu className="size-6" strokeWidth={2} aria-hidden />
            )}
          </button>
          <Link
            to="/"
            className={`min-w-0 flex-1 transition ${
              mobileNavOpen ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <Logo size="medium" showEyebrow={false} />
          </Link>
        </header>

        <Sidebar />

        <main className="min-h-0 min-w-0 flex-1 p-1 sm:p-2 md:p-3">
          <Outlet />
        </main>

        {mobileNavOpen ? (
          <>
            <div
              className="fixed inset-0 z-40 cursor-pointer bg-black/45 backdrop-blur-sm md:hidden"
              aria-hidden
              onClick={() => setMobileNavOpen(false)}
            />
            <div
              className="fixed inset-y-0 left-0 z-50 w-[min(20rem,calc(100vw-1rem))] py-3 pr-3 md:hidden"
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <SidebarShell className="h-full overflow-hidden rounded-r-[1.75rem] rounded-l-none px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl">
                <div className="h-full overflow-y-auto overscroll-contain pr-1">
                  <SidebarContent
                    onNavigate={() => setMobileNavOpen(false)}
                    onClose={() => setMobileNavOpen(false)}
                  />
                </div>
              </SidebarShell>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl">
        <Outlet />
      </div>
    </div>
  );
}
