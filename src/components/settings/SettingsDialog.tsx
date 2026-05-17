import { useEffect } from "react";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { Icon } from "../common/Icon";
import { LLMConfigTab } from "./LLMConfig";
import { WorkspaceTab } from "./WorkspaceTab";
import { SkillsTab } from "./SkillsTab";
import { TemplatesTab } from "./TemplatesTab";
import { GeneralTab } from "./GeneralTab";

const tabs = [
  { id: "llm" as const, label: "LLM 配置" },
  { id: "workspace" as const, label: "工作区管理" },
  { id: "skill" as const, label: "Skills 管理" },
  { id: "template" as const, label: "Prompt 模板" },
  { id: "general" as const, label: "通用设置" },
];

export function SettingsDialog() {
  const { isSettingsOpen, activeSettingsTab, closeSettings, setActiveTab } = useSettingsStore();

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSettings();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  const renderTab = () => {
    switch (activeSettingsTab) {
      case "llm": return <LLMConfigTab />;
      case "workspace": return <WorkspaceTab />;
      case "skill": return <SkillsTab />;
      case "template": return <TemplatesTab />;
      case "general": return <GeneralTab />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/35 z-[300] flex items-center justify-center animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}
    >
      <div
        className="w-[720px] max-h-[80vh] bg-bg rounded-[var(--radius-lg)] shadow-lg flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="flex items-center px-6 py-4 border-b border-border gap-3 flex-shrink-0">
          <h2 className="text-[16px] font-bold flex-1">设置</h2>
          <button
            className="w-[30px] h-[30px] flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150 text-text-secondary hover:bg-bg-sub"
            onClick={closeSettings}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* 主体 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧导航 */}
          <div className="w-[180px] flex-shrink-0 border-r border-border py-3 px-2 overflow-y-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`px-3 py-2 rounded-[var(--radius-sm)] text-[13px] cursor-pointer transition-colors duration-150 mb-[2px] ${
                  activeSettingsTab === tab.id
                    ? "bg-accent-light text-accent font-medium"
                    : "text-text-secondary hover:bg-bg-sub"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
