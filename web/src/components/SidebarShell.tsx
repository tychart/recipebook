import type { ReactNode } from "react";
import { useBorderTheme } from "../context/BorderThemeContext";
import {
  SIDEBAR_GINGHAM_CELL_PX,
  sidebarBackgroundImage,
} from "../theme/borderTheme";

type SidebarShellProps = {
  children: ReactNode;
  className?: string;
};

export function SidebarShell({ children, className = "" }: SidebarShellProps) {
  const { borderTheme } = useBorderTheme();
  const sidebarTilePx = SIDEBAR_GINGHAM_CELL_PX * 2;

  return (
    <aside
      className={`flex flex-col p-[6px] no-print ${className}`}
      style={{
        backgroundImage: sidebarBackgroundImage(borderTheme),
        backgroundRepeat: "no-repeat, round",
        backgroundSize: `100% 100%, ${sidebarTilePx}px ${sidebarTilePx}px`,
        backgroundOrigin: "border-box",
        backgroundClip: "content-box, border-box",
      }}
    >
      {children}
    </aside>
  );
}
