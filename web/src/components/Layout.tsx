import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user } = useAuth();

  // 🔒 If logged in → show sidebar layout
  if (user) {
    return (
      <div className="flex flex-1 w-full min-h-min">
        <Sidebar />
        <main className="flex-1 min-h-min p-8">
          <Outlet />
        </main>
      </div>
    );
  }

  // 🌐 If not logged in → center content
  return (
    <div className="flex min-h-0 flex-1 w-full items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
