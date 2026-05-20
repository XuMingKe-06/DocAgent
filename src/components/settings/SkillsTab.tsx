import { useSettingsStore } from "../../stores/useSettingsStore";

export function SkillsTab() {
  const { skills, toggleSkill } = useSettingsStore();

  return (
    <div>
      <div className="section-header">
        <span className="section-title">内置 Skills</span>
        <span className="section-badge">{skills.filter((s) => s.enabled).length} / {skills.length}</span>
      </div>

      <div className="skills-list">
        {skills.map((s) => (
          <div key={s.id} className="skill-item">
            <div className="skill-item-info">
              <div className="skill-name">{s.name}</div>
              <div className="skill-desc">{s.description}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                className="toggle-input"
                checked={s.enabled}
                onChange={() => toggleSkill(s.id)}
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          </div>
        ))}
      </div>

      <div className="custom-skills-section">
        <div className="section-header">
          <span className="section-title">自定义 Skills</span>
        </div>
        <div className="empty-state-lg">暂无自定义 Skill，点击下方按钮添加</div>
        <button className="add-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          添加自定义 Skill
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
        .skills-list {
          display: flex;
          flex-direction: column;
          margin-bottom: 24px;
        }
        .skill-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid var(--color-border-light);
          transition: background 0.15s;
        }
        .skill-item:hover {
          background: var(--color-accent-bg);
        }
        .skill-item:last-child {
          border-bottom: none;
        }
        .skill-item-info {
          flex: 1;
          min-width: 0;
        }
        .skill-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .skill-desc {
          font-size: 11px;
          color: var(--color-text-quaternary);
          margin-top: 2px;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .toggle-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-track {
          position: absolute;
          inset: 0;
          background: var(--color-border-strong);
          border-radius: 10px;
          transition: background 0.2s;
        }
        .toggle-input:checked + .toggle-track {
          background: var(--color-accent);
        }
        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .toggle-input:checked ~ .toggle-thumb {
          transform: translateX(16px);
        }
        .custom-skills-section {
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
