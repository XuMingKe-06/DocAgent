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
    <div className={`relative mb-1 animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      <div className="absolute -left-[28px] top-[14px] w-[22px] h-[22px] rounded-full flex items-center justify-center z-[2] bg-bg-sub text-text-secondary">
        <Icon name="tool" size={12} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-bg overflow-hidden transition-colors duration-150 hover:border-[#D0D3D9]">
        <div className="flex items-center gap-2 px-[14px] py-[10px] cursor-pointer select-none" onClick={onToggle}>
          <span className="text-[12px] font-semibold uppercase tracking-[.3px] text-text-secondary">工具调用</span>
          <span className="text-[11px] text-text-tertiary font-mono ml-auto">{formatTime(node.timestamp)}</span>
          <span className="w-5 h-5 flex items-center justify-center rounded-[4px] transition-colors duration-150 text-text-tertiary hover:bg-bg-sub">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="px-[14px] pb-3">
            <div className="flex flex-col gap-2 py-1">
              {/* 工具名 */}
              <div className="inline-flex items-center gap-[6px] font-mono text-[12px] font-medium px-2 py-[3px] bg-bg-sub rounded-[4px] text-text-primary w-fit">
                <span className="text-[10px] font-semibold px-[5px] py-[1px] rounded-[3px] bg-accent-light text-accent font-sans">
                  {data.toolBadge || "Skill"}
                </span>
                {data.toolName}
              </div>
              {/* JSON 参数 */}
              <div className="font-mono text-[12px] text-text-secondary leading-[1.6] bg-bg-sub px-[10px] py-2 rounded-[var(--radius-sm)] whitespace-pre-wrap break-all">
                {JSON.stringify(data.input, null, 2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
