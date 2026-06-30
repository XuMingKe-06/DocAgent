import { useTranslation } from 'react-i18next';
import { useSettingsStore } from "../../stores/useSettingsStore";
import { WindowControls } from "./WindowControls";
import { WorkspaceSelector } from "./WorkspaceSelector";

export function TopBar() {
  const { t } = useTranslation();
  const { llmProviders, activeProviderId } = useSettingsStore();
  const activeProvider = llmProviders.find((p) => p.id === activeProviderId);

  const hasProvider = !!activeProvider;
  const statusText = hasProvider ? activeProvider.model : t('topBar.disconnected');
  const statusColor = hasProvider ? "bg-success" : "bg-text-tertiary";

  return (
    <div role="banner" data-tauri-drag-region className="flex items-center h-[52px] pr-4 bg-bg-sub flex-shrink-0 gap-3 z-[100]" style={{ paddingLeft: '24px' }}>
      {/* 工作区选择器 */}
      <WorkspaceSelector />

      <div className="flex-1" />

      {/* 状态指示器 - 对接实际 LLM Provider 状态 */}
      <div className="flex items-center gap-[6px] text-[11px] text-text-tertiary" aria-label={hasProvider ? t('topBar.connected') : t('topBar.disconnected')}>
        <span className={`w-[6px] h-[6px] rounded-full ${statusColor}`} />
        <span>{statusText}</span>
      </div>

      {/* 窗口控制按钮 */}
      <WindowControls />
    </div>
  );
}
