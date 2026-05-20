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
        <div className="empty-state">
          <Icon name="check-circle" size={20} className="opacity-40" />
          <span>暂无任务</span>
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
            className={`todo-item ${
              item.done ? "done" :
              item.active ? "active" :
              "pending"
            }`}
          >
            <span
              className={`todo-indicator ${
                item.done
                  ? "indicator-done"
                  : item.active
                  ? "indicator-active"
                  : "indicator-pending"
              }`}
            >
              {item.done && (
                <Icon name="check" size={10} strokeWidth={3} />
              )}
              {item.active && (
                <span className="active-dot" />
              )}
            </span>
            <span className={`todo-text ${item.done ? "line-through" : ""}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .todo-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          transition: all 0.15s;
        }
        .todo-item:hover {
          background: var(--color-accent-bg);
        }
        .todo-item.done {
          color: var(--color-text-quaternary);
        }
        .todo-item.active {
          color: var(--color-accent);
          font-weight: 500;
          background: var(--color-accent-lighter);
        }
        .todo-item.pending {
          color: var(--color-text-secondary);
        }
        .todo-indicator {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .indicator-done {
          background: var(--color-success);
          border: 1.5px solid var(--color-success);
          color: white;
        }
        .indicator-active {
          border: 1.5px solid var(--color-accent);
          background: var(--color-accent-light);
        }
        .indicator-pending {
          border: 1.5px solid var(--color-border-strong);
        }
        .active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent);
          animation: pulse 1.5s infinite;
        }
        .todo-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 20px 16px;
          color: var(--color-text-quaternary);
          font-size: 12px;
        }
      `}</style>
    </SidebarSection>
  );
}
