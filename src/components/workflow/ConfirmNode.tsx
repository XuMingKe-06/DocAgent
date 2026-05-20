import type { WorkflowNode, ConfirmNodeData } from "../../types";
import { formatTime } from "../../utils/format";
import { Icon } from "../common/Icon";
import { useWorkflowStore } from "../../stores/useWorkflowStore";

interface ConfirmNodeProps {
  node: WorkflowNode<"confirm">;
  onToggle: () => void;
}

export function ConfirmNode({ node, onToggle }: ConfirmNodeProps) {
  const data = node.data as ConfirmNodeData;
  const confirmHandler = useWorkflowStore((s) => s.confirmHandler);

  const isPending = data.confirmed === null && node.status === "running";

  return (
    <div className={`wf-node animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      <div className="wf-node-dot bg-warning-light text-warning">
        <Icon name="warning" size={12} />
      </div>

      <div className="wf-node-card" style={{ borderColor: "var(--color-warning)" }}>
        <div className="wf-node-header" onClick={onToggle}>
          <span className="wf-node-label" style={{ color: "var(--color-warning)" }}>
            操作确认
          </span>
          <span className="wf-node-time">{formatTime(node.timestamp)}</span>
          {data.confirmed !== null && (
            <span className={`text-[11px] font-medium ${data.confirmed ? "text-success" : "text-error"}`}>
              {data.confirmed ? "已确认" : "已取消"}
            </span>
          )}
          <span className="wf-node-toggle">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="wf-node-body">
            <div>
              <div className="flex items-center gap-[6px] text-[13px] font-semibold text-warning mb-[6px]">
                <Icon name="warning" size={16} />
                {data.title}
              </div>
              <div className="text-[12px] text-text-secondary leading-[1.5] mb-[10px]">
                {data.description}
              </div>
              {isPending ? (
                <div className="flex gap-2">
                  <button
                    className="btn btn-danger"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await confirmHandler?.(true);
                    }}
                  >
                    {data.confirmLabel}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await confirmHandler?.(false);
                    }}
                  >
                    {data.cancelLabel}
                  </button>
                </div>
              ) : (
                <div className={`text-[12px] font-medium ${data.confirmed ? "text-success" : "text-error"}`}>
                  {data.confirmed ? "✓ 用户已确认执行" : "✗ 用户已取消操作"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
