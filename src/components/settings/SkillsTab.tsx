import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/useSettingsStore";
import * as tauriCmd from "../../services/tauri";
import { useToastStore } from "../../stores/useToastStore";

export function SkillsTab() {
  const { t } = useTranslation();
  const { skills, tools, refreshSkills } = useSettingsStore();
  const addToast = useToastStore((s) => s.addToast);

  // 内置 Skill 列表
  const builtinSkills = skills.filter((s) => s.isBuiltin);

  // 切换 Skill 启用/禁用状态
  const handleToggleSkill = async (skillId: string, enabled: boolean) => {
    try {
      await tauriCmd.toggleSkill(skillId, enabled);
      // 刷新 Skill 列表以反映最新状态
      await refreshSkills();
    } catch (err) {
      addToast(
        "error",
        `${t('settings.skills.toggleFailed')}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return (
    <div>
      {/* 内置 Tools */}
      <div className="section-header">
        <span className="section-title">{t('settings.tools.builtinTools')}</span>
        <span className="section-badge">{tools.length}</span>
      </div>

      <div className="skills-list">
        {tools.map((tool) => (
          <div key={tool.id} className="skill-item">
            <div className="skill-item-info">
              <div className="skill-name-row">
                <span className="skill-name">{tool.name}</span>
                <span className="skill-tool-badge">{t('settings.skills.toolBadge')}</span>
              </div>
              <div className="skill-desc">{tool.description}</div>
            </div>
            <div className="tool-always-on">
              {t('settings.tools.alwaysEnabled')}
            </div>
          </div>
        ))}
      </div>

      {/* 内置 Skills */}
      <div className="section-header" style={{ marginTop: 24 }}>
        <span className="section-title">{t('settings.skills.builtinSkills')}</span>
        <span className="section-badge">{builtinSkills.length}</span>
      </div>

      <div className="skills-list">
        {builtinSkills.map((s) => {
          const isCodeInterpreter = s.id === "code_interpreter_skill";
          return (
            <div key={s.id} className="skill-item">
              <div className="skill-item-info">
                <div className="skill-name-row">
                  <span className="skill-name">{s.name}</span>
                  <span className="skill-skill-badge">{t('settings.skills.skillBadge')}</span>
                  {isCodeInterpreter && (
                    <span className="skill-advanced-badge">{t('settings.skills.advanced')}</span>
                  )}
                </div>
                <div className="skill-desc">{s.description}</div>
                {/* Code Interpreter 禁用时显示安全提示 */}
                {isCodeInterpreter && !s.enabled && (
                  <div className="skill-hint">{t('settings.skills.codeInterpreterDisabledHint')}</div>
                )}
              </div>
              <label className="skill-toggle">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => handleToggleSkill(s.id, e.target.checked)}
                />
                <span className="skill-toggle-slider" />
              </label>
            </div>
          );
        })}
      </div>

      <style>{`
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
        .skill-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .skill-tool-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 4px;
          background: var(--color-accent-bg);
          color: var(--color-accent);
        }
        .skill-skill-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 4px;
          background: var(--color-purple-light);
          color: var(--color-purple);
        }
        .skill-advanced-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 4px;
          background: var(--color-warning-light);
          color: var(--color-warning-dark, #D97706);
        }
        .tool-always-on {
          font-size: 11px;
          color: var(--color-text-quaternary);
          flex-shrink: 0;
        }
        .skill-desc {
          font-size: 11px;
          color: var(--color-text-quaternary);
          margin-top: 2px;
          /* 限制描述最多显示两行 */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .skill-hint {
          font-size: 11px;
          color: var(--color-warning, #D97706);
          margin-top: 4px;
        }
        .skill-toggle {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
          flex-shrink: 0;
          margin-left: 12px;
        }
        .skill-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .skill-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-border, #ccc);
          transition: 0.2s;
          border-radius: 20px;
        }
        .skill-toggle-slider::before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.2s;
          border-radius: 50%;
        }
        .skill-toggle input:checked + .skill-toggle-slider {
          background-color: var(--color-accent, #2E75B6);
        }
        .skill-toggle input:checked + .skill-toggle-slider::before {
          transform: translateX(16px);
        }
        .skill-toggle input:focus-visible + .skill-toggle-slider {
          outline: 2px solid var(--color-accent, #2E75B6);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
