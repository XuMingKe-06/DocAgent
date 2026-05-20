import type { WorkflowNode, UserNodeData } from "../../types";
import { formatTime } from "../../utils/format";
import { Icon } from "../common/Icon";

interface UserNodeProps {
  node: WorkflowNode<"user">;
  onToggle: () => void;
}

export function UserNode({ node, onToggle }: UserNodeProps) {
  const data = node.data as UserNodeData;

  return (
    <div className={`wf-node animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      {/* 圆点 */}
      <div className="wf-node-dot bg-accent-light text-accent">
        <Icon name="user" size={12} />
      </div>

      {/* 卡片 */}
      <div className="wf-node-card">
        <div className="wf-node-header" onClick={onToggle}>
          <span className="wf-node-label user">用户指令</span>
          <span className="wf-node-time">{formatTime(node.timestamp)}</span>
          <span className="wf-node-toggle">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="wf-node-body">
            <div className="wf-user-text">{data.content}</div>
          </div>
        )}
      </div>
    </div>
  );
}
