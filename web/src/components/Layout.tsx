import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarContent } from "./SidebarContent";
import { SidebarShell } from "./SidebarShell";
import { useAuth } from "../context/AuthContext";
import { useBorderTheme } from "../context/BorderThemeContext";
import { sidebarTitleLinkClasses } from "../theme/borderTheme";

/** Matches mobile header height for backdrop / drawer offset */
const MOBILE_HEADER_TOP_CLASS = "top-14";

export default function Layout() {
  const { user } = useAuth();
  const { borderTheme } = useBorderTheme();
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
      <div className="relative flex min-h-0 w-full flex-1 flex-col md:flex-row">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-stone-300/50 bg-[#eee9e0] px-2 no-print md:hidden">
          <button
            type="button"
            className="-m-2 w-auto shrink-0 rounded-md p-2 text-stone-800 hover:bg-stone-200/80"
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
            className={`min-w-0 flex-1 truncate text-center text-2xl font-semibold tracking-tight transition ${sidebarTitleLinkClasses[borderTheme]}`}
          >
            RecipeBook
          </Link>
          <div
            className="hidden w-10 shrink-0 min-[450px]:block"
            aria-hidden
          />
        </header>

        <Sidebar />

        <main className="min-h-min min-w-0 flex-1 p-4 md:p-8">
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
              <SidebarShell className="h-full w-[min(18rem,100%)] overflow-y-auto rounded-none shadow-2xl">
                <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
              </SidebarShell>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
