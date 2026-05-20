import { useSettingsStore } from "../../stores/useSettingsStore";

export function GeneralTab() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div>
      <div className="settings-section">
        <div className="section-header">
          <span className="section-title">基本设置</span>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">作者名（全局默认）</div>
            <div className="setting-desc">生成文档时自动填充的作者元数据</div>
          </div>
          <input
            className="setting-input"
            value={settings.general.authorName}
            onChange={(e) => updateSettings({ general: { authorName: e.target.value } })}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">操作确认级别</div>
            <div className="setting-desc">Agent执行文件操作时的确认策略</div>
          </div>
          <select
            className="setting-select"
            value={settings.general.confirmationLevel}
            onChange={(e) => updateSettings({ general: { confirmationLevel: e.target.value as typeof settings.general.confirmationLevel } })}
          >
            <option value="always">全部需确认</option>
            <option value="editOnly">仅编辑操作确认</option>
            <option value="never">全部自动确认</option>
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">语言</div>
          </div>
          <select
            className="setting-select"
            value={settings.general.language}
            onChange={(e) => updateSettings({ general: { language: e.target.value } })}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <span className="section-title">Token 预算</span>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">日预算上限</div>
            <div className="setting-desc">超出时触发提醒</div>
          </div>
          <input
            className="setting-input setting-input-narrow"
            placeholder="不限制"
            value={settings.tokenBudget.dailyLimit || ""}
            onChange={(e) => updateSettings({ tokenBudget: { dailyLimit: Number(e.target.value) || 0 } })}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">月预算上限</div>
          </div>
          <input
            className="setting-input setting-input-narrow"
            placeholder="不限制"
            value={settings.tokenBudget.monthlyLimit || ""}
            onChange={(e) => updateSettings({ tokenBudget: { monthlyLimit: Number(e.target.value) || 0 } })}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">超出预算行为</div>
          </div>
          <select
            className="setting-select"
            value={settings.tokenBudget.exceedAction}
            onChange={(e) => updateSettings({ tokenBudget: { exceedAction: e.target.value as typeof settings.tokenBudget.exceedAction } })}
          >
            <option value="warn">仅提醒</option>
            <option value="block">暂停Agent</option>
            <option value="fallback">切换到更便宜的模型</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <span className="section-title">版本快照</span>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">保留策略</div>
          </div>
          <select
            className="setting-select"
            value={settings.versionSnapshot.retentionPolicy}
            onChange={(e) => updateSettings({ versionSnapshot: { retentionPolicy: e.target.value as typeof settings.versionSnapshot.retentionPolicy } })}
          >
            <option value="byCount">按数量（最近{settings.versionSnapshot.maxCount}个）</option>
            <option value="byDays">按时间（最近{settings.versionSnapshot.maxDays}天）</option>
            <option value="both">两者都满足</option>
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">应用数据目录</div>
            <div className="setting-desc">快照和配置的存储位置</div>
          </div>
          <span className="setting-path">%APPDATA%/DocAgent</span>
        </div>
      </div>

      <style>{`
        .settings-section {
          margin-bottom: 24px;
        }
        .settings-section:last-child {
          margin-bottom: 0;
        }
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
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid var(--color-border-light);
          gap: 16px;
        }
        .setting-row:last-child {
          border-bottom: none;
        }
        .setting-info {
          flex: 1;
          min-width: 0;
        }
        .setting-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .setting-desc {
          font-size: 11px;
          color: var(--color-text-quaternary);
          margin-top: 2px;
        }
        .setting-input {
          padding: 6px 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          transition: all 0.2s;
          background: var(--color-bg);
          color: var(--color-text-primary);
        }
        .setting-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px var(--color-accent-lighter);
          outline: none;
        }
        .setting-input-narrow {
          width: 120px;
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
        .setting-path {
          font-size: 12px;
          color: var(--color-text-quaternary);
          font-family: var(--font-mono);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
