import { useState, useCallback, useEffect } from "react";
import { TopBar } from "./components/layout/TopBar";
import { MainLayout } from "./components/layout/MainLayout";
import { MainArea } from "./components/layout/MainArea";
import { InputArea } from "./components/layout/InputArea";
import { WorkflowTimeline } from "./components/workflow/WorkflowTimeline";
import { FileTreeSection } from "./components/sidebar/FileTreeSection";
import { AgentInfoSection } from "./components/sidebar/AgentInfoSection";
import { TodoSection } from "./components/sidebar/TodoSection";
import { TokenSection } from "./components/sidebar/TokenSection";
import { PreviewOverlay } from "./components/preview/PreviewOverlay";
import { SettingsDialog } from "./components/settings/SettingsDialog";
import { HistoryPanel } from "./components/session/HistoryPanel";
import { useWorkflowStore } from "./stores/useWorkflowStore";

export default function App() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templateLabel, setTemplateLabel] = useState<string | undefined>(undefined);
  const { addNode } = useWorkflowStore();

  // 发送用户消息
  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    addNode("user", { content: text, attachments: [] });
    // TODO: 发送消息到 Agent 后端，由后端处理并返回结果
  }, [addNode]);

  // 监听来自 Tauri 后端的预览事件
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewOpen(false);
      }
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        useWorkflowStore.getState().clearNodes();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="app flex flex-col h-screen">
      <TopBar
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
        onNewSession={() => useWorkflowStore.getState().clearNodes()}
      />

      <MainLayout
        mainArea={
          <MainArea
            workflow={<WorkflowTimeline />}
            inputArea={
              <InputArea
                onSend={handleSend}
                templateLabel={templateLabel}
                onToggleTemplate={() => setTemplateLabel(templateLabel ? undefined : "生成周报")}
              />
            }
          />
        }
        sidebar={
          <>
            <FileTreeSection />
            <AgentInfoSection />
            <TodoSection />
            <TokenSection />
          </>
        }
      />

      {/* 浮层面板 */}
      <PreviewOverlay open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <SettingsDialog />
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />

      <style>{`
        .app { display: flex; flex-direction: column; height: 100vh; }
        .topbar-btn {
          width: 34px; height: 34px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; color: var(--color-text-secondary);
        }
        .topbar-btn:hover { background: var(--color-bg-sub); color: var(--color-text-primary); }
        .input-btn {
          width: 32px; height: 32px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; color: var(--color-text-tertiary);
        }
        .input-btn:hover { background: var(--color-bg-sub); color: var(--color-text-secondary); }
      `}</style>
    </div>
  );
}
