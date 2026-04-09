import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBorderTheme } from "../context/BorderThemeContext";
import {
  sidebarActiveNavClasses,
  sidebarBackgroundImage,
  sidebarTitleLinkClasses,
} from "../theme/borderTheme";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { borderTheme } = useBorderTheme();

  // 🔒 Hide entire sidebar if not logged in
  if (!user) return null;

  const handleLogout = async () => {
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
        className={`block px-4 py-2 rounded-md text-sm font-medium transition border ${
          isActive ? activeClasses : inactiveClasses
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside
      className="w-64 min-h-screen p-[6px] flex flex-col rounded-lg no-print"
      style={{
        backgroundImage: sidebarBackgroundImage(borderTheme),
        backgroundOrigin: "border-box",
        backgroundClip: "content-box, border-box",
      }}
    >
      <div className="flex flex-col h-full p-6 text-center">
        {/* App Title */}
        <Link
          to="/"
          className={`text-2xl font-semibold mb-10 tracking-tight transition ${sidebarTitleLinkClasses[borderTheme]}`}
        >
          RecipeBook
        </Link>

        {/* User Name */}
        <div className="mb-8">
          <p className="text-lg font-medium text-black">{user.username}</p>
        </div>

        {/* Main Navigation */}
        <div className="flex flex-col gap-3 mb-8">
          {navItem("/cookbooks", "My Cookbooks")}
          {navItem("/search", "Search")}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {navItem("/cookbooks/new", "Create a Cookbook")}
          {navItem("/account", "Account Details")}

          {/* Logout Button (styled same as nav items) */}
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 rounded-md text-sm font-medium transition border bg-white text-black border-black hover:bg-stone-100 cursor-pointer"
          >
            Logout
          </button>
        </div>

        <div className="flex-grow" />

        {/* Footer */}
        <p className="text-xs text-stone-400 mt-6">Cookbook App v1</p>
      </div>
    </aside>
  );
}
