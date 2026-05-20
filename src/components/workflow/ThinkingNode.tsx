import type { WorkflowNode, ThinkingNodeData } from "../../types";
import { formatTime } from "../../utils/format";
import { Icon } from "../common/Icon";

interface ThinkingNodeProps {
  node: WorkflowNode<"thinking">;
  onToggle: () => void;
}

export function ThinkingNode({ node, onToggle }: ThinkingNodeProps) {
  const data = node.data as ThinkingNodeData;

  return (
    <div className={`wf-node animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      <div className="wf-node-dot" style={{ background: "#F3F0FF", color: "#6C5CE7" }}>
        <Icon name="thinking" size={12} />
      </div>

      <div className="wf-node-card">
        <div className="wf-node-header" onClick={onToggle}>
          <span className="wf-node-label thinking">思考中</span>
          <span className="wf-node-time">{formatTime(node.timestamp)}</span>
          <span className="wf-node-toggle">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="wf-node-body">
            <div className="wf-thinking-text">
              {data.content}
              {node.status === "running" && (
                <span className="cursor-blink" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
