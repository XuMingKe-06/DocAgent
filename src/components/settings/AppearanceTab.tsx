import { useSettingsStore } from "../../stores/useSettingsStore";
import type { ThemeMode } from "../../types";

export function AppearanceTab() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div>
      <div className="settings-section">
        <div className="section-header">
          <span className="section-title">主题</span>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">主题模式</div>
            <div className="setting-desc">选择应用的配色方案</div>
          </div>
          <div className="theme-switcher">
            {([
              { value: "light" as ThemeMode, label: "浅色" },
              { value: "dark" as ThemeMode, label: "深色" },
              { value: "system" as ThemeMode, label: "跟随系统" },
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

      <div className="settings-section">
        <div className="section-header">
          <span className="section-title">字体</span>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">字体大小</div>
            <div className="setting-desc">
              当前: {Math.round(settings.appearance.fontScale * 100)}%
            </div>
          </div>
          <div className="font-scale-control">
            <button
              className="scale-btn"
              onClick={() => {
                const next = Math.max(0.8, +(settings.appearance.fontScale - 0.1).toFixed(1));
                updateSettings({ appearance: { fontScale: next } });
              }}
              disabled={settings.appearance.fontScale <= 0.8}
            >
              A-
            </button>
            <input
              type="range"
              className="scale-slider"
              min="0.8"
              max="1.4"
              step="0.1"
              value={settings.appearance.fontScale}
              onChange={(e) => {
                updateSettings({ appearance: { fontScale: parseFloat(e.target.value) } });
              }}
            />
            <button
              className="scale-btn"
              onClick={() => {
                const next = Math.min(1.4, +(settings.appearance.fontScale + 0.1).toFixed(1));
                updateSettings({ appearance: { fontScale: next } });
              }}
              disabled={settings.appearance.fontScale >= 1.4}
            >
              A+
            </button>
            <button
              className="scale-reset-btn"
              onClick={() => updateSettings({ appearance: { fontScale: 1.0 } })}
            >
              重置
            </button>
          </div>
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
        .font-scale-control {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .scale-btn {
          width: 32px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          background: var(--color-bg);
          cursor: pointer;
          transition: all 0.15s;
        }
        .scale-btn:hover:not(:disabled) {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }
        .scale-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .scale-slider {
          width: 100px;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--color-border);
          border-radius: 2px;
          outline: none;
        }
        .scale-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .scale-reset-btn {
          padding: 4px 10px;
          font-size: 11px;
          color: var(--color-text-tertiary);
          background: var(--color-bg-sub);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s;
        }
        .scale-reset-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
