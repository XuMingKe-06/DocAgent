import { SidebarSection } from "../layout/Sidebar";
import { Icon } from "../common/Icon";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  active: boolean;
}

interface TodoSectionProps {
  items?: TodoItem[];
}

export function TodoSection({ items }: TodoSectionProps) {
  const todoItems = items ?? [];

  if (todoItems.length === 0) {
    return (
      <SidebarSection title="任务进度">
        <div className="text-[13px] text-text-tertiary text-center py-4">
          暂无任务
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="任务进度">
      <div className="flex flex-col gap-1">
        {todoItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 px-2 py-[6px] rounded-[var(--radius-sm)] text-[13px] ${
              item.done ? "text-text-tertiary" :
              item.active ? "text-accent font-medium" :
              "text-text-secondary"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                item.done
                  ? "bg-success border-success text-white"
                  : item.active
                  ? "border-accent bg-accent-light"
                  : "border-border"
              }`}
            >
              {item.done && (
                <Icon name="check" size={10} strokeWidth={3} />
              )}
              {item.active && (
                <span className="w-[6px] h-[6px] rounded-full bg-accent animate-[pulse_1.5s_infinite]" />
              )}
            </span>
            <span className={item.done ? "line-through" : ""}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </SidebarSection>
  );
}
