import type { WorkflowNode, ToolNodeData } from "../../types";
import { useTranslation } from 'react-i18next';
import { Icon } from "../common/Icon";

interface ToolNodeProps {
  node: WorkflowNode<"tool">;
}

export function ToolNode({ node }: ToolNodeProps) {
  const { t } = useTranslation();
  const data = node.data as ToolNodeData;
  const hasError = data.success === false;
  // 判断工具是否正在执行中
  const isRunning = node.status === "running";

  return (
    <div className={`wf-node animate-node-in${isRunning ? " wf-tool-running" : ""}`}>
      <div className={`wf-node-dot${isRunning ? " wf-tool-dot-running" : " bg-bg-sub text-text-secondary"}`}>
        {isRunning ? (
          // 执行中：显示旋转加载图标
          <svg className="wf-tool-spinner" viewBox="0 0 24 24" fill="none">
            <circle className="wf-tool-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="wf-tool-spinner-arc" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : hasError ? (
          // 执行失败：显示错误图标
          <Icon name="error" size={12} />
        ) : (
          // 执行完成：显示工具图标
          <Icon name="tool" size={12} />
        )}
      </div>

      <div className="wf-tool-brief">
        <span className="font-mono">{data.toolName}</span>
        <span> · </span>
        <span>{data.briefDescription}</span>
        {isRunning && (
          <span className="wf-tool-status-running">{t('toolNode.executing')}</span>
        )}
        {hasError && data.error && (
          <span className="wf-tool-error"> — {data.error}</span>
        )}
      </div>
    </div>
  );
}
