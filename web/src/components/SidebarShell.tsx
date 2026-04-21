import type { ReactNode } from "react";

type SidebarShellProps = {
  children: ReactNode;
  className?: string;
};

export function SidebarShell({ children, className = "" }: SidebarShellProps) {
  return (
    <aside
      className={`sidebar-shell rounded-[1.75rem] p-4 no-print ${className}`}
    >
      {children}
    </aside>
  );
}
