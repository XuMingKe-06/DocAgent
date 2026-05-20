import type { WorkflowNode, ToolNodeData } from "../../types";
import { formatTime } from "../../utils/format";
import { Icon } from "../common/Icon";

interface ToolNodeProps {
  node: WorkflowNode<"tool">;
  onToggle: () => void;
}

export function ToolNode({ node, onToggle }: ToolNodeProps) {
  const data = node.data as ToolNodeData;

  return (
    <div className={`wf-node animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      <div className="wf-node-dot bg-bg-sub text-text-secondary">
        <Icon name="tool" size={12} />
      </div>

      <div className="wf-node-card">
        <div className="wf-node-header" onClick={onToggle}>
          <span className="wf-node-label tool">工具调用</span>
          <span className="wf-node-time">{formatTime(node.timestamp)}</span>
          <span className="wf-node-toggle">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="wf-node-body">
            <div className="wf-tool-info">
              {/* 工具名 */}
              <div className="wf-tool-name">
                <span className="tool-badge">{data.toolBadge || "Skill"}</span>
                {data.toolName}
              </div>
              {/* JSON 参数 */}
              <div className="wf-tool-args">
                {JSON.stringify(data.input, null, 2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
