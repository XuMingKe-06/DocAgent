import { useEffect, useState } from "react";
import { Icon } from "../common/Icon";

interface DiffData {
  oldContent: string;
  newContent: string;
}

interface PreviewOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  content?: string;
  diffData?: DiffData | null;
}

export function PreviewOverlay({
  open,
  onClose,
  title = "",
  content = "",
  diffData = null,
}: PreviewOverlayProps) {
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowDiff(false);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-[200] flex items-center justify-center animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-4/5 max-w-[960px] h-[85vh] bg-bg rounded-[var(--radius-lg)] shadow-lg flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center px-5 py-3 border-b border-border gap-3 flex-shrink-0">
          <button
            className="w-[30px] h-[30px] flex items-center justify-center rounded-[var(--radius-sm)] transition-colors text-text-secondary hover:bg-bg-sub"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
          <span className="font-semibold text-[14px] flex-1 truncate">{title}</span>
          <div className="flex gap-[6px]">
            {diffData && (
              <button
                className="px-[10px] py-1 rounded-[var(--radius-sm)] text-[11px] font-medium bg-bg-sub text-text-secondary hover:bg-bg-hover transition-all"
                onClick={() => setShowDiff(!showDiff)}
              >
                {showDiff ? "文档预览" : "差异对比"}
              </button>
            )}
          </div>
        </div>

        {/* 内容区 */}
        {showDiff && diffData ? (
          <DiffView oldContent={diffData.oldContent} newContent={diffData.newContent} />
        ) : (
          <div className="flex-1 overflow-y-auto px-10 py-8 leading-[1.8] text-text-secondary text-[14px] whitespace-pre-wrap">
            {content || (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                暂无内容
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DiffView({ oldContent, newContent }: { oldContent: string; newContent: string }) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const maxLen = Math.max(oldLines.length, newLines.length);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-5 font-mono text-[12px] leading-[1.8] bg-[#FAFAFA] border-r border-border">
        <div className="px-3 py-2 bg-bg-sub font-sans font-semibold text-[12px] mb-3 sticky top-0">修改前</div>
        {Array.from({ length: maxLen }, (_, i) => {
          const oldLine = oldLines[i] ?? "";
          const newLine = newLines[i] ?? "";
          const isRemoved = oldLine && oldLine !== newLine;
          return (
            <div key={i} className={isRemoved ? "bg-error-light text-error" : ""}>
              <span className="diff-ln">{i + 1}</span>{oldLine}
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 font-mono text-[12px] leading-[1.8] bg-bg">
        <div className="px-3 py-2 bg-bg-sub font-sans font-semibold text-[12px] mb-3 sticky top-0">修改后</div>
        {Array.from({ length: maxLen }, (_, i) => {
          const oldLine = oldLines[i] ?? "";
          const newLine = newLines[i] ?? "";
          const isAdded = newLine && newLine !== oldLine;
          return (
            <div key={i} className={isAdded ? "bg-success-light text-success" : ""}>
              <span className="diff-ln">{i + 1}</span>{newLine}
            </div>
          );
        })}
      </div>
      <style>{`.diff-ln { display: inline-block; width: 36px; color: var(--color-text-tertiary); text-align: right; margin-right: 12px; user-select: none; }`}</style>
    </div>
  );
}
