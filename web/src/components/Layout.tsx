import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  // Placeholder user (replace later with auth context)
  const currentUser = "Jordan Brockbank";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar currentUser={currentUser} />

      {/* Main Content Area */}
      <main className="flex-1 bg-transparent p-8">
        <Outlet />
      </main>
    </div>
  );
}