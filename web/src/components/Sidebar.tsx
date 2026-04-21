import { useAuth } from "../context/AuthContext";
import { SidebarContent } from "./SidebarContent";
import { SidebarShell } from "./SidebarShell";

export default function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <SidebarShell className="hidden w-72 self-stretch md:flex">
      <SidebarContent />
    </SidebarShell>
  );
}
