import { useTranslation } from 'react-i18next';
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { ThemeMode } from "../../types";

export function AppearanceTab() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div>
      <div className="settings-section">
        <div className="section-header">
          <span className="section-title">{t('settings.appearance.sectionTitle')}</span>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">{t('settings.appearance.themeMode')}</div>
            <div className="setting-desc">{t('settings.appearance.themeModeDesc')}</div>
          </div>
          <div className="theme-switcher">
            {([
              { value: "light" as ThemeMode, label: t('settings.appearance.light') },
              { value: "dark" as ThemeMode, label: t('settings.appearance.dark') },
              { value: "system" as ThemeMode, label: t('settings.appearance.followSystem') },
            ]).map((opt) => (
              <button
                key={opt.value}
                className={`theme-btn ${settings.appearance.themeMode === opt.value ? "active" : ""}`}
                onClick={() => updateSettings({ appearance: { themeMode: opt.value } })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 语言设置 */}
      <div className="settings-section">
        <div className="section-header">
          <span className="section-title">{t('settings.appearance.languageSection')}</span>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">{t('settings.appearance.language')}</div>
            <div className="setting-desc">{t('settings.appearance.languageDesc')}</div>
          </div>
          <select
            className="setting-select"
            value={settings.appearance.language}
            onChange={(e) => updateSettings({ appearance: { language: e.target.value, languageFollowSystem: false } })}
          >
            <option value="zh-CN">{t('settings.appearance.zhCN')}</option>
            <option value="en-US">{t('settings.appearance.enUS')}</option>
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">{t('settings.appearance.languageFollowSystem')}</div>
            <div className="setting-desc">{t('settings.appearance.languageFollowSystemDesc')}</div>
          </div>
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.appearance.languageFollowSystem}
              onChange={(e) => updateSettings({ appearance: { languageFollowSystem: e.target.checked } })}
            />
            <span className="setting-toggle-slider" />
          </label>
        </div>
      </div>

      <style>{`
        .theme-switcher {
          display: flex;
          gap: 0;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
        }
        .theme-btn {
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          background: var(--color-bg);
          border: none;
          border-right: 1px solid var(--color-border);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .theme-btn:last-child {
          border-right: none;
        }
        .theme-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }
        .theme-btn.active {
          background: var(--color-accent);
          color: #fff;
        }
        .theme-btn.active:hover {
          background: var(--color-accent-hover);
        }
        .setting-select {
          padding: 6px 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          background: var(--color-bg);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .setting-select:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px var(--color-accent-lighter);
          outline: none;
        }
        .setting-toggle {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .setting-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }
        .setting-toggle-slider {
          position: absolute;
          inset: 0;
          background: var(--color-border-strong);
          border-radius: 10px;
          transition: all 0.2s;
        }
        .setting-toggle-slider::before {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          left: 2px;
          top: 2px;
          background: var(--color-bg-elevated);
          border-radius: 50%;
          transition: all 0.2s;
        }
        .setting-toggle input:checked + .setting-toggle-slider {
          background: var(--color-accent);
        }
        .setting-toggle input:checked + .setting-toggle-slider::before {
          transform: translateX(16px);
        }
        .setting-toggle input:focus-visible + .setting-toggle-slider {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
