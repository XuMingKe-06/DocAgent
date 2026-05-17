import type { ReactNode } from "react";
import { useState } from "react";
import { Icon } from "../common/Icon";

interface SidebarSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SidebarSection({ title, defaultOpen = true, children }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors duration-150 hover:bg-black/[.02]"
        onClick={() => setOpen(!open)}
      >
        <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-[.5px]">
          {title}
        </span>
        <span
          className="text-text-tertiary transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <Icon name="chevron-down" size={14} />
        </span>
      </div>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
