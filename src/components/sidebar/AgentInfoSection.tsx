import { useState } from "react";
import { SidebarSection } from "../layout/Sidebar";
import { useSettingsStore } from "../../stores/useSettingsStore";

const confirmationLevelLabels: Record<string, string> = {
  always: "全部需确认",
  editOnly: "仅编辑操作确认",
  never: "全部自动确认",
};

export function AgentInfoSection() {
  const { settings, llmProviders, activeProviderId, updateSettings } = useSettingsStore();
  const activeProvider = llmProviders.find((p) => p.id === activeProviderId);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(settings.general.authorName);

  const handleSave = () => {
    if (editValue.trim()) {
      updateSettings({ general: { authorName: editValue.trim() } });
    }
    setEditing(false);
  };

  return (
    <SidebarSection title="Agent 信息">
      <div className="flex flex-col gap-[10px]">
        <div className="info-row">
          <span className="info-label">当前模型</span>
          <div className={`info-badge ${activeProvider ? "status-online" : "status-offline"}`}>
            <span className={`status-dot ${activeProvider ? "bg-success" : "bg-text-quaternary"}`} />
            {activeProvider?.model ?? "未配置"}
          </div>
        </div>

        <div className="info-row">
          <span className="info-label">Provider</span>
          <span className="info-value">{activeProvider?.providerType ?? "未配置"}</span>
        </div>

        <div className="info-row">
          <span className="info-label">作者名</span>
          {editing ? (
            <input
              className="edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              autoFocus
            />
          ) : (
            <span
              className="info-value clickable"
              onClick={() => { setEditValue(settings.general.authorName); setEditing(true); }}
            >
              {settings.general.authorName || "未设置"}
            </span>
          )}
        </div>

        <div className="info-row">
          <span className="info-label">确认级别</span>
          <span className="info-value">
            {confirmationLevelLabels[settings.general.confirmationLevel] ?? settings.general.confirmationLevel}
          </span>
        </div>
      </div>

      <style>{`
        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .info-label {
          font-size: 12px;
          color: var(--color-text-quaternary);
          flex-shrink: 0;
        }
        .info-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          background: var(--color-bg-sub);
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 500;
        }
        .info-badge.status-online {
          background: var(--color-success-bg);
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .info-value.clickable {
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
        }
        .info-value.clickable:hover {
          border-color: var(--color-border);
          background: var(--color-bg-sub);
        }
        .edit-input {
          font-size: 13px;
          font-weight: 500;
          padding: 2px 6px;
          border: 1px solid var(--color-border-strong);
          border-radius: 4px;
          width: 100px;
          transition: all 0.2s;
        }
        .edit-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px var(--color-accent-lighter);
        }
      `}</style>
    </SidebarSection>
  );
}
