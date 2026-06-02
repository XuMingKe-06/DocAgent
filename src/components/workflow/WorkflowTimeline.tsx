import { useState, useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import { useWorkspaceStore } from "../../stores/useWorkspaceStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { Icon } from "../common/Icon";
import { AddWorkspaceDialog } from "../settings/AddWorkspaceDialog";
import { WorkflowNodeRenderer } from "./WorkflowNode";

interface WorkflowTimelineProps {
  /** 错误节点重试回调 */
  onRetryError?: () => void;
}

/**
 * 工作流时间线组件（虚拟滚动版）
 * 使用 @tanstack/react-virtual 实现虚拟滚动，仅渲染可视区域内的节点
 * 支持动态高度测量和自动滚动
 */
export function WorkflowTimeline({ onRetryError }: WorkflowTimelineProps) {
  const { nodes } = useWorkflowStore();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const llmProviders = useSettingsStore((s) => s.llmProviders);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 追踪是否应自动滚动（用户未手动上滚时自动跟随）
  const autoScrollRef = useRef(true);

  // 创建虚拟化器，使用动态高度测量
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => scrollRef.current,
    // 预估节点高度，用于首次渲染前的布局计算
    estimateSize: (index) => {
      const node = nodes[index];
      if (!node) return 60;
      switch (node.type) {
        case "user": return 60;
        case "thinking": return 80;
        case "content": return 120;
        case "tool": return 40;
        case "confirm": return 100;
        case "error": return 80;
        default: return 60;
      }
    },
    // 启用动态测量，当节点内容变化时自动重新计算高度
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
    // 过扫描量：在可视区域外额外渲染的节点数，减少快速滚动时的空白
    overscan: 5,
  });

  // 检测用户是否手动上滚，决定是否自动跟随
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 距离底部 50px 以内视为"在底部"，保持自动滚动
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    autoScrollRef.current = distanceFromBottom < 50;
  }, []);

  // 新增节点时自动滚动到底部
  useEffect(() => {
    if (autoScrollRef.current && nodes.length > 0) {
      // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(nodes.length - 1, {
          align: "end",
          behavior: "smooth",
        });
      });
    }
  }, [nodes.length, virtualizer]);

  // 空状态：根据工作区和服务商配置情况展示引导提示
  const hasWorkspace = !!currentWorkspaceId;
  const hasProvider = llmProviders.length > 0;

  if (nodes.length === 0) {
    return (
      <div className="wf-empty" role="status" aria-label="空会话">
        {/* 无工作区时的引导 */}
        {!hasWorkspace && (
          <div className="wf-empty-guide">
            <div className="wf-empty-guide-icon">
              <Icon name="folder" size={28} />
            </div>
            <h3 className="wf-empty-title">选择工作区</h3>
            <p className="wf-empty-desc">
              请先选择一个文件夹作为工作区，Agent 将在该目录下操作文档
            </p>
            <button
              className="wf-empty-guide-btn"
              onClick={() => setShowAddWorkspace(true)}
            >
              <Icon name="folder-plus" size={16} />
              <span>添加工作区</span>
            </button>
          </div>
        )}

        {/* 两个引导区域之间的分割线 */}
        {!hasWorkspace && !hasProvider && (
          <div className="wf-empty-divider" />
        )}

        {/* 无服务商时的引导 */}
        {!hasProvider && (
          <div className="wf-empty-guide">
            <div className="wf-empty-guide-icon wf-empty-guide-icon-secondary">
              <Icon name="settings" size={28} />
            </div>
            <h3 className="wf-empty-title">配置服务商</h3>
            <p className="wf-empty-desc">
              请先配置大模型服务商，Agent 需要通过大模型来理解和处理你的指令
            </p>
            <button
              className="wf-empty-guide-btn wf-empty-guide-btn-secondary"
              onClick={() => openSettings("llm")}
            >
              <Icon name="plus" size={16} />
              <span>添加服务商</span>
            </button>
          </div>
        )}

        {/* 工作区和服务商均已就绪，显示默认开始提示 */}
        {hasWorkspace && hasProvider && (
          <>
            <h3 className="wf-empty-title">开始新会话</h3>
            <p className="wf-empty-desc">
              在下方输入指令，Agent 将协助你处理文档
            </p>
          </>
        )}

        {/* 添加工作区弹窗 */}
        {showAddWorkspace && (
          <AddWorkspaceDialog
            onClose={() => setShowAddWorkspace(false)}
            onSaved={() => setShowAddWorkspace(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="workflow-scroll-container"
      onScroll={handleScroll}
      role="log"
      aria-label="工作流时间线"
      aria-live="polite"
    >
      <div
        className="workflow-timeline"
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const node = nodes[virtualItem.index];
          if (!node) return null;

          return (
            <div
              key={node.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                // 绝对定位元素不尊重父元素的 padding，需要手动补偿
                // 使 .wf-node 从 timeline 的内容区域开始，图标和竖线才能正确对齐
                paddingLeft: "28px",
                // 使用 transform 定位，比 top 性能更好（避免 reflow）
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <WorkflowNodeRenderer node={node} onRetry={onRetryError} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
