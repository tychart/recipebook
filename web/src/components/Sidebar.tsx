import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  currentUser: string;
}

export default function Sidebar({ currentUser }: SidebarProps) {
  const location = useLocation();

  const navItem = (to: string, label: string) => {
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        className={`block px-4 py-2 rounded-md text-sm font-medium transition border
          ${
            isActive
              ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
              : "bg-white text-black border-black hover:bg-stone-100"
          }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-64 min-h-screen bg-transparent border-2 border-red-500 p-6 flex flex-col">
      
      {/* App Title */}
      <Link
        to="/"
        className="text-2xl font-semibold text-red-500 mb-10 tracking-tight hover:text-red-600 transition"
      >
        RecipeBook
      </Link>

      {/* User Name */}
      <div className="mb-8">
        <p className="text-lg font-medium text-black">
          {currentUser}
        </p>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-3 mb-8">
        {navItem("/cookbooks", "Cookbooks")}
        {navItem("/search", "Search")}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {navItem("/recipe/new", "Input New Recipe")}
        {navItem("/cookbook/new", "Create a Cookbook")}
        {navItem("/account", "Account Details")}
      </div>

      <div className="flex-grow" />

      {/* Footer */}
      <p className="text-xs text-stone-400 mt-6">
        Cookbook App v1
      </p>
    </aside>
  );
}