import type { ReactNode } from "react";

type SidebarShellProps = {
  children: ReactNode;
  className?: string;
};

export function SidebarShell({ children, className = "" }: SidebarShellProps) {
  return (
    <aside
      className={`app-panel app-pattern flex flex-col p-4 no-print ${className}`}
    >
      {children}
    </aside>
  );
}
