// 快捷键组合解析结果
export interface ParsedShortcut {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

// 解析快捷键字符串（如 "Ctrl+Enter"、"Enter"、"Shift+Enter"）为结构化对象
export function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.split("+").map((p) => p.trim());
  return {
    ctrlKey: parts.includes("Ctrl"),
    shiftKey: parts.includes("Shift"),
    altKey: parts.includes("Alt"),
    key: parts[parts.length - 1] || "",
  };
}

// 判断键盘事件是否匹配快捷键组合
export function matchesShortcut(e: { key: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  return (
    e.key.toLowerCase() === parsed.key.toLowerCase() &&
    e.ctrlKey === parsed.ctrlKey &&
    e.shiftKey === parsed.shiftKey &&
    e.altKey === parsed.altKey
  );
}

// 根据 sendMessage 快捷键推导换行快捷键
// 如果发送是 Enter，则换行是 Shift+Enter；如果发送是 Ctrl+Enter，则换行是 Enter
export function deriveNewLineShortcut(sendShortcut: string): string {
  const parsed = parseShortcut(sendShortcut);
  if (parsed.key.toLowerCase() === "enter") {
    if (parsed.ctrlKey) {
      return "Enter";
    }
    if (parsed.shiftKey) {
      return "Enter";
    }
    return "Shift+Enter";
  }
  return "Enter";
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 8);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateToolBrief(toolName: string, input: Record<string, unknown>): string {
  const f = (key: string) => String(input[key] ?? "");
  const actionMap: Record<string, string> = {
    generate: "生成",
    read: "读取",
    modify: "修改",
    convert: "转换",
    analyze: "分析",
  };
  const formatMap: Record<string, string> = {
    docx_skill: "Word",
    xlsx_skill: "Excel",
    pptx_skill: "PPT",
    pdf_skill: "PDF",
  };
  const action = actionMap[f("action")] || "";
  const format = formatMap[toolName] || "";
  switch (toolName) {
    case "docx_skill":
    case "xlsx_skill":
    case "pptx_skill":
    case "pdf_skill":
      // 流式阶段提前发射时参数可能为空，此时只显示格式名称
      if (action) {
        return `${action} ${format} ${f("path") || "文档"}`;
      }
      return `${format} ${f("path") || "文档"}`;
    case "delete_file":
      return `删除 ${f("path") || "文件"}`;
    case "search_files":
      return `搜索 ${f("query") ? `"${f("query")}"` : "文件"}`;
    case "list_directory":
      return "列出目录";
    case "read_file":
      return `读取 ${f("path") || "文件"}`;
    case "write_text_file":
      return `写入 ${f("path") || "文件"}`;
    default:
      return toolName;
  }
}
