import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Icon } from "../common/Icon";

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  templateLabel?: string;
  onToggleTemplate?: () => void;
}

export function InputArea({ onSend, disabled = false, templateLabel, onToggleTemplate }: InputAreaProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  return (
    <div className="px-8 py-4 border-t border-border bg-bg flex-shrink-0 max-md:px-5 max-md:pb-4">
      {/* 模板标签 */}
      {templateLabel && (
        <div className="inline-flex items-center gap-1 px-2 py-[3px] bg-accent-light rounded-[4px] text-[11px] text-accent font-medium mb-2">
          <Icon name="template" size={12} />
          <span>{templateLabel}</span>
        </div>
      )}

      {/* 输入框 */}
      <div className="flex items-end gap-2 border-[1.5px] border-border rounded-[var(--radius-md)] px-3 py-[10px] transition-all duration-200 bg-bg focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(51,112,255,.1)]">
        <button className="input-btn" title="附加文件">
          <Icon name="attach" />
        </button>

        <textarea
          ref={textareaRef}
          className="flex-1 resize-none min-h-[22px] max-h-[120px] leading-[1.5] text-[14px]"
          rows={1}
          placeholder="输入指令，让Agent帮你处理文档..."
          value={text}
          onChange={(e) => { setText(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <button className="input-btn" title="Prompt模板" onClick={onToggleTemplate}>
          <Icon name="template" />
        </button>

        <button
          className="w-[34px] h-[34px] flex items-center justify-center rounded-[var(--radius-sm)] bg-accent text-white hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          title="发送"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
        >
          <Icon name="send" />
        </button>
      </div>

      {/* 快捷键提示 */}
      <div className="text-[11px] text-text-tertiary mt-[6px] flex items-center gap-3">
        <span>
          <kbd className="font-mono text-[10px] px-[5px] py-[1px] bg-bg-sub border border-border rounded-[3px]">Enter</kbd> 发送
        </span>
        <span>
          <kbd className="font-mono text-[10px] px-[5px] py-[1px] bg-bg-sub border border-border rounded-[3px]">Shift + Enter</kbd> 换行
        </span>
        <span>
          <kbd className="font-mono text-[10px] px-[5px] py-[1px] bg-bg-sub border border-border rounded-[3px]">Ctrl + N</kbd> 新建会话
        </span>
      </div>
    </div>
  );
}
