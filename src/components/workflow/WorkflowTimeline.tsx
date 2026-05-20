import { useEffect, useRef } from "react";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import { WorkflowNodeRenderer } from "./WorkflowNode";
import { Icon } from "../common/Icon";

export function WorkflowTimeline() {
  const { nodes } = useWorkflowStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新节点
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [nodes.length]);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-4">
        <div className="w-16 h-16 rounded-[16px] bg-bg-sub flex items-center justify-center">
          <Icon name="file" size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-text-secondary">开始新会话</h3>
        <p className="text-[13px] max-w-[320px] text-center leading-[1.6]">
          在下方输入指令，Agent 将协助你处理文档。
        </p>
      </div>
    );
  }

  return (
    <div className="workflow-timeline">
      {nodes.map((node) => (
        <WorkflowNodeRenderer key={node.id} node={node} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
