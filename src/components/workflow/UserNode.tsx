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
    <div className={`relative mb-1 animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      {/* 圆点 */}
      <div className="absolute -left-[28px] top-[14px] w-[22px] h-[22px] rounded-full flex items-center justify-center z-[2] bg-accent-light text-accent">
        <Icon name="user" size={12} />
      </div>

      {/* 卡片 */}
      <div className="rounded-[var(--radius-md)] border border-border bg-bg overflow-hidden transition-colors duration-150 hover:border-[#D0D3D9]">
        <div className="flex items-center gap-2 px-[14px] py-[10px] cursor-pointer select-none" onClick={onToggle}>
          <span className="text-[12px] font-semibold uppercase tracking-[.3px] text-accent">用户指令</span>
          <span className="text-[11px] text-text-tertiary font-mono ml-auto">{formatTime(node.timestamp)}</span>
          <span className="w-5 h-5 flex items-center justify-center rounded-[4px] transition-colors duration-150 text-text-tertiary hover:bg-bg-sub">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="px-[14px] pb-3">
            <div className="text-[14px] leading-[1.6] text-text-primary py-1">{data.content}</div>
          </div>
        )}
      </div>
    </div>
  );
}
