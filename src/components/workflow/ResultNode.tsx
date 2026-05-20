import type { WorkflowNode, ResultNodeData } from "../../types";
import { formatTime } from "../../utils/format";
import { Icon } from "../common/Icon";

interface ResultNodeProps {
  node: WorkflowNode<"result">;
  onToggle: () => void;
}

export function ResultNode({ node, onToggle }: ResultNodeProps) {
  const data = node.data as ResultNodeData;

  return (
    <div className={`wf-node animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      <div className={`wf-node-dot ${data.success ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
        <Icon name={data.success ? "result" : "error"} size={12} />
      </div>

      <div className="wf-node-card">
        <div className="wf-node-header" onClick={onToggle}>
          <span className={`wf-node-label ${data.success ? "result" : "error"}`}>
            {data.success ? "执行成功" : "执行失败"}
          </span>
          <span className="wf-node-time">{formatTime(node.timestamp)}</span>
          <span className="wf-node-toggle">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="wf-node-body">
            <div className={`wf-result-text ${data.success ? "success" : "error"}`}>
              {data.content}
            </div>
            {data.filePaths.map((fp) => (
              <div
                key={fp}
                className="wf-result-file"
              >
                <Icon name="file" size={14} />
                {fp}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
