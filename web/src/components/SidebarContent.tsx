import { X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import PwaInstallPrompt from "./PwaInstallPrompt";

type SidebarContentProps = {
  /** Called when a nav link is followed or after logout (e.g. close mobile drawer). */
  onNavigate?: () => void;
  onClose?: () => void;
};

export function SidebarContent({ onNavigate, onClose }: SidebarContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    navigate("/home");
  };

  const navItem = (to: string, label: string) => {
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        onClick={() => onNavigate?.()}
        aria-current={isActive ? "page" : undefined}
        className={`sidebar-nav-item ${
          isActive
            ? "sidebar-nav-item-active"
            : ""
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <Link to="/" onClick={() => onNavigate?.()} className="inline-flex">
          <Logo size="medium" />
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="app-button app-button-ghost inline-flex size-11 shrink-0 rounded-2xl p-0 md:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="sidebar-user-card rounded-[1.5rem] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Signed in
        </p>
        <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
          {user.username}
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{user.email}</p>
      </div>

      <nav className="flex flex-col gap-2" aria-label="Primary navigation">
        {navItem("/cookbooks", "My Cookbooks")}
        {navItem("/search", "Search")}
        {navItem("/jobs", "Jobs")}
      </nav>

      <div className="flex flex-col gap-2">
        {navItem("/cookbooks/new", "Create a Cookbook")}
        {navItem("/account", "Account Details")}

        <button
          type="button"
          onClick={handleLogout}
          className="app-button app-button-ghost justify-start border-[var(--border-muted)]"
        >
          Logout
        </button>
      </div>

      <PwaInstallPrompt />

      <div className="min-h-0 flex-grow" />

      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
        RecipeBook Web V2
      </p>
    </div>
  );
}
