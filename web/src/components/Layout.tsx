import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarContent } from "./SidebarContent";
import { SidebarShell } from "./SidebarShell";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

/** Matches mobile header height for backdrop / drawer offset */
const MOBILE_HEADER_TOP_CLASS = "top-[5.25rem]";

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  if (user) {
    return (
      <div className="relative flex min-h-0 w-full flex-1 flex-col gap-4 p-3 md:flex-row md:p-4">
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
          <Link to="/" className="min-w-0 flex-1">
            <Logo size="medium" />
          </Link>
        </header>

        <Sidebar />

        <main className="min-h-min min-w-0 flex-1 p-1 sm:p-2 md:p-3">
          <Outlet />
        </main>

        {mobileNavOpen ? (
          <>
            <div
              className={`absolute ${MOBILE_HEADER_TOP_CLASS} bottom-0 left-0 right-0 z-40 cursor-pointer bg-black/40 md:hidden`}
              aria-hidden
              onClick={() => setMobileNavOpen(false)}
            />
            <div
              className={`absolute bottom-0 left-0 z-50 md:hidden ${MOBILE_HEADER_TOP_CLASS}`}
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <SidebarShell className="h-full w-[min(20rem,100%)] overflow-y-auto rounded-r-[1.75rem] rounded-l-none shadow-2xl">
                <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
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
