import { useSettingsStore } from "../../stores/useSettingsStore";

export function TemplatesTab() {
  const { templates } = useSettingsStore();

  return (
    <div>
      <div className="section-header">
        <span className="section-title">内置模板</span>
        <span className="section-badge">{templates.length}</span>
      </div>

      <div className="templates-list">
        {templates.map((tpl) => (
          <div key={tpl.id} className="template-card">
            <div className="template-name">{tpl.name}</div>
            <div className="template-desc">{tpl.description}</div>
          </div>
        ))}
      </div>

      <div className="custom-templates-section">
        <div className="section-header">
          <span className="section-title">自定义模板</span>
        </div>
        <div className="empty-state-lg">暂无自定义模板</div>
        <button className="add-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          创建模板
        </button>
      </div>

      <style>{`
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .section-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 1px 8px;
          border-radius: 10px;
          background: var(--color-accent-light);
          color: var(--color-accent);
        }
        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }
        .template-card {
          padding: 12px 14px;
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s;
        }
        .template-card:hover {
          border-color: var(--color-border-strong);
          background: var(--color-accent-bg);
        }
        .template-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }
        .template-desc {
          font-size: 11px;
          color: var(--color-text-quaternary);
        }
        .custom-templates-section {
          margin-top: 24px;
        }
        .empty-state-lg {
          font-size: 13px;
          color: var(--color-text-quaternary);
          text-align: center;
          padding: 24px 16px;
        }
        .add-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 500;
          background: var(--color-accent);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .add-btn:hover {
          background: var(--color-accent-hover);
        }
      `}</style>
    </div>
  );
}
