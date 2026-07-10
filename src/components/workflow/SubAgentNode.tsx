import { useTranslation } from "react-i18next";
import type { WorkflowNode, SubAgentNodeData } from "../../types";
import { Icon } from "../common/Icon";

interface SubAgentNodeProps {
  node: WorkflowNode<"sub_agent">;
}

/**
 * 子 Agent 节点
 * 在 Agent 执行过程中触发子 Agent 时显示
 * - running: 显示"子 Agent 执行中: {taskDescription}" + 迭代次数
 * - completed: 显示"子 Agent 完成: {taskDescription}" + 迭代次数 + 工具调用次数
 * - failed: 显示"子 Agent 失败: {taskDescription}" + 错误消息
 * - cancelled: 显示"子 Agent 已取消: {taskDescription}"
 * - 如果有工具调用(toolCalls)，展开显示工具名列表
 */
export function SubAgentNode({ node }: SubAgentNodeProps) {
  const { t } = useTranslation();
  const data = node.data as SubAgentNodeData;
  const isRunning = data.status === "running";
  const isFailed = data.status === "failed";
  const isCompleted = data.status === "completed";
  const isCancelled = data.status === "cancelled";

  // 根据状态选择图标
  const iconName = isRunning
    ? "refresh"
    : isFailed
      ? "warning"
      : isCompleted
        ? "check-circle"
        : "stop";

  // 主文本：根据状态显示不同内容
  const getText = (): string => {
    if (isRunning) {
      return t("subAgentNode.running", { task: data.taskDescription });
    }
    if (isFailed) {
      return t("subAgentNode.failed", { task: data.taskDescription });
    }
    if (isCompleted) {
      return t("subAgentNode.completed", { task: data.taskDescription });
    }
    if (isCancelled) {
      return t("subAgentNode.cancelled", { task: data.taskDescription });
    }
    return data.taskDescription;
  };

  // 状态相关的 CSS 类名
  const stateClass = isRunning
    ? " wf-subagent-running"
    : isFailed
      ? " wf-subagent-failed"
      : isCompleted
        ? " wf-subagent-completed"
        : " wf-subagent-cancelled";

  return (
    <div className="wf-node">
      <div className={`wf-subagent-flat${stateClass}`}>
        <Icon
          name={iconName}
          size={12}
          className={isRunning ? "wf-subagent-spin" : undefined}
        />
        <span className="wf-subagent-text">{getText()}</span>
        {/* 迭代次数 */}
        <span className="wf-subagent-meta">
          {t("subAgentNode.iterations", { count: data.iteration })}
        </span>
        {/* 完成状态显示工具调用次数 */}
        {isCompleted && data.toolCalls.length > 0 && (
          <span className="wf-subagent-meta">
            {t("subAgentNode.toolCalls", { count: data.toolCalls.length })}
          </span>
        )}
      </div>
      {/* 失败时显示错误消息 */}
      {isFailed && data.message && (
        <div className="wf-subagent-error">
          {t("subAgentNode.error", { message: data.message })}
        </div>
      )}
      {/* 工具调用列表（有工具调用时展开显示） */}
      {data.toolCalls.length > 0 && (
        <div className="wf-subagent-tools">
          {data.toolCalls.map((tc, idx) => (
            <div key={idx} className="wf-subagent-tool-item">
              <Icon name="tool" size={10} />
              <span>{tc.toolName}</span>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .wf-subagent-flat {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 0;
          font-size: 12px;
          color: var(--color-text-tertiary);
          line-height: 1.6;
          flex: 1;
          min-width: 0;
          flex-wrap: wrap;
        }
        .wf-subagent-running {
          color: var(--color-accent, #3b82f6);
        }
        .wf-subagent-failed {
          color: var(--color-error, #ef4444);
        }
        .wf-subagent-completed {
          color: var(--color-success, #22c55e);
        }
        .wf-subagent-cancelled {
          color: var(--color-text-tertiary);
        }
        .wf-subagent-text {
          font-size: 12px;
        }
        .wf-subagent-meta {
          font-size: 11px;
          color: var(--color-text-quaternary);
          padding: 0 4px;
          border-radius: 3px;
          background: var(--color-bg-tertiary);
        }
        .wf-subagent-error {
          margin-top: 2px;
          padding-left: 18px;
          font-size: 11px;
          color: var(--color-error, #ef4444);
          line-height: 1.5;
        }
        .wf-subagent-tools {
          margin-top: 4px;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .wf-subagent-tool-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-tertiary);
        }
        .wf-subagent-spin {
          animation: wf-subagent-spin 1s linear infinite;
        }
        @keyframes wf-subagent-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
