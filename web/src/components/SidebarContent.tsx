import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBorderTheme } from "../context/BorderThemeContext";
import {
  sidebarActiveNavClasses,
  sidebarTitleLinkClasses,
} from "../theme/borderTheme";

type SidebarContentProps = {
  /** Called when a nav link is followed or after logout (e.g. close mobile drawer). */
  onNavigate?: () => void;
};

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { borderTheme } = useBorderTheme();

  if (!user) return null;

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    navigate("/home");
  };

  const navItem = (to: string, label: string) => {
    const isActive = location.pathname === to;
    const activeClasses = sidebarActiveNavClasses[borderTheme];
    const inactiveClasses =
      "bg-white text-black border-black hover:bg-stone-100";

    return (
      <Link
        to={to}
        onClick={() => onNavigate?.()}
        className={`block px-4 py-2 rounded-md text-sm font-medium transition border ${
          isActive ? activeClasses : inactiveClasses
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col p-6 text-center">
      <Link
        to="/"
        onClick={() => onNavigate?.()}
        className={`mb-10 text-2xl font-semibold tracking-tight transition ${sidebarTitleLinkClasses[borderTheme]}`}
      >
        RecipeBook
      </Link>

      <div className="mb-8">
        <p className="text-lg font-medium text-black">{user.username}</p>
      </div>

      <div className="mb-8 flex flex-col gap-3">
        {navItem("/cookbooks", "My Cookbooks")}
        {navItem("/search", "Search")}
        {navItem("/jobs", "Jobs")}
      </div>

      <div className="flex flex-col gap-3">
        {navItem("/cookbooks/new", "Create a Cookbook")}
        {navItem("/account", "Account Details")}

        <button
          type="button"
          onClick={handleLogout}
          className="block w-full cursor-pointer rounded-md border border-black bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-stone-100"
        >
          Logout
        </button>
      </div>

      <div className="min-h-0 flex-grow" />

      <p className="mt-6 text-xs text-stone-400">Cookbook App v1</p>
    </div>
  );
}
