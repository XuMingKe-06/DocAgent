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
    <div className={`relative mb-1 animate-node-in ${!node.isExpanded ? "collapsed" : ""}`}>
      <div className={`absolute -left-[28px] top-[14px] w-[22px] h-[22px] rounded-full flex items-center justify-center z-[2] ${data.success ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
        <Icon name={data.success ? "result" : "error"} size={12} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-bg overflow-hidden transition-colors duration-150 hover:border-[#D0D3D9]">
        <div className="flex items-center gap-2 px-[14px] py-[10px] cursor-pointer select-none" onClick={onToggle}>
          <span className={`text-[12px] font-semibold uppercase tracking-[.3px] ${data.success ? "text-success" : "text-error"}`}>
            {data.success ? "执行成功" : "执行失败"}
          </span>
          <span className="text-[11px] text-text-tertiary font-mono ml-auto">{formatTime(node.timestamp)}</span>
          <span className="w-5 h-5 flex items-center justify-center rounded-[4px] transition-colors duration-150 text-text-tertiary hover:bg-bg-sub">
            <Icon name="chevron-down" size={14} style={{ transform: node.isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </span>
        </div>
        {node.isExpanded && (
          <div className="px-[14px] pb-3">
            <div className={`text-[13px] leading-[1.6] py-1 ${data.success ? "text-success" : "text-error"}`}>
              {data.content}
            </div>
            {data.filePaths.map((fp) => (
              <div
                key={fp}
                className="inline-flex items-center gap-[6px] px-[10px] py-1 bg-accent-light rounded-[var(--radius-sm)] text-[12px] text-accent cursor-pointer mt-1 transition-colors duration-150 hover:bg-[#D9E5FF]"
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
