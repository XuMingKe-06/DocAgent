import type { ReactNode } from "react";

interface MainLayoutProps {
  mainArea: ReactNode;
  sidebar: ReactNode;
}

export function MainLayout({ mainArea, sidebar }: MainLayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 主界面区 */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {mainArea}
      </div>

      {/* 右侧栏 */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-bg-sub overflow-hidden sidebar-narrow">
        {sidebar}
      </div>
    </div>
  );
}
