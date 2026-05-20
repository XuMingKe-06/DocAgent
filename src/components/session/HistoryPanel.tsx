import { useEffect } from "react";
import { Icon } from "../common/Icon";
import { useSessionStore } from "../../stores/useSessionStore";

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onSwitchSession: (sessionId: string) => void;
}

export function HistoryPanel({ open, onClose, onSwitchSession }: HistoryPanelProps) {
  const { sessions, currentSessionId, loadSessions } = useSessionStore();

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open, loadSessions]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[140] bg-overlay/30"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-[52px] left-0 w-[300px] bottom-0 bg-bg border-r border-border z-[150] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="history-header">
          <h3 className="history-title">历史会话</h3>
          <button
            className="history-close-btn"
            onClick={onClose}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="history-list">
          {sessions.length === 0 ? (
            <div className="history-empty">
              <Icon name="history" size={32} className="opacity-30" />
              <p>暂无历史会话</p>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`history-item ${s.id === currentSessionId ? "active" : ""}`}
                onClick={() => { onSwitchSession(s.id); onClose(); }}
              >
                <div className={`history-item-title ${s.id === currentSessionId ? "text-accent" : ""}`}>
                  {s.title}
                </div>
                <div className="history-item-meta">
                  <span>{new Date(s.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span>
                  <span className="history-status">{s.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <style>{`
          .history-header {
            padding: 16px;
            border-bottom: 1px solid var(--color-border-light);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .history-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-primary);
          }
          .history-close-btn {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm);
            color: var(--color-text-secondary);
            transition: all 0.15s;
          }
          .history-close-btn:hover {
            background: var(--color-bg-sub);
            color: var(--color-text-primary);
          }
          .history-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
          }
          .history-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 12px;
            color: var(--color-text-quaternary);
            font-size: 13px;
          }
          .history-item {
            padding: 10px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s;
            margin-bottom: 2px;
            border: 1px solid transparent;
          }
          .history-item:hover {
            background: var(--color-accent-bg);
            border-color: var(--color-accent-light);
          }
          .history-item.active {
            background: var(--color-accent-light);
            border-color: var(--color-accent-light);
          }
          .history-item-title {
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 4px;
            color: var(--color-text-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .history-item-meta {
            font-size: 11px;
            color: var(--color-text-quaternary);
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .history-status {
            padding: 1px 6px;
            border-radius: 3px;
            background: var(--color-bg-sub);
            font-size: 10px;
            font-weight: 500;
          }
          .history-item.active .history-status {
            background: var(--color-accent-light);
            color: var(--color-accent);
          }
        `}</style>
      </div>
    </>
  );
}
