import type { WorkflowNode, ReplyNodeData } from "../../types";
import { formatTime } from "../../utils/format";
import { Icon } from "../common/Icon";

interface ReplyNodeProps {
  node: WorkflowNode<"reply">;
  onToggle: () => void;
}

/** 将纯文本中的简单 Markdown 格式转换为安全的 HTML（仅处理行内格式，防止 XSS） */
function renderSafeContent(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export function ReplyNode({ node, onToggle }: ReplyNodeProps) {
  const data = node.data as ReplyNodeData;
  const isStreaming = node.status === "running";

  return (
    <div className={`wf-node animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      <div className="wf-node-dot bg-accent-light text-accent">
        <Icon name="reply" size={12} />
      </div>

      <div className="wf-node-card">
        <div className="wf-node-header" onClick={onToggle}>
          <span className="wf-node-label reply">回复</span>
          {isStreaming && (
            <span className="inline-block w-[6px] h-[6px] rounded-full bg-accent animate-pulse" />
          )}
          <span className="wf-node-time">{formatTime(node.timestamp)}</span>
          <span className="wf-node-toggle">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="wf-node-body">
            <div
              className="wf-reply-text reply-content"
              dangerouslySetInnerHTML={{ __html: renderSafeContent(data.content) }}
            />
            {isStreaming && (
              <span className="inline-block w-[2px] h-[16px] bg-accent animate-pulse ml-[1px] align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
