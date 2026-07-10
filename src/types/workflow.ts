export type NodeStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type ExecutionStatus = "idle" | "running" | "stopping" | "paused" | "completed" | "failed" | "cancelled";

export type WorkflowNodeType = "user" | "thinking" | "content" | "tool" | "confirm" | "error" | "compaction";

export interface Attachment {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface UserNodeData {
  content: string;
  attachments: Attachment[];
}

export interface ThinkingNodeData {
  content: string;
  duration: number;
  isStreaming?: boolean;
}

export interface ContentNodeData {
  content: string;
  isStreaming?: boolean;
}

export interface ToolNodeData {
  toolName: string;
  briefDescription: string;
  input: Record<string, unknown>;
  /** 工具调用的唯一标识，用于流式阶段提前发射后去重更新 */
  callId?: string;
  success?: boolean;
  error?: string;
  /** 工具执行结果（如 bash 的 stdout/stderr/exit_code），成功时填充 */
  result?: Record<string, unknown>;
}

export interface ConfirmNodeData {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmed: boolean | null;
  /** 用户拒绝时填写的反馈原因 */
  feedback?: string;
  /** Phase 2: 风险等级（critical/high/medium/normal） */
  riskLevel?: string;
  /** Phase 2: 权限审批回复（once/always/reject） */
  permissionResponse?: 'once' | 'always' | 'reject' | null;
}

export interface ErrorNodeData {
  code: number;
  message: string;
  recoverable: boolean;
  module: string;
}

/** 上下文压缩节点数据 */
export interface CompactionNodeData {
  /** 压缩前 token 数 */
  tokensBefore: number;
  /** 压缩后 token 数（compaction_done 事件到达后填充） */
  tokensAfter?: number;
  /** 是否实际执行了压缩（compaction_done 事件到达后填充） */
  compacted?: boolean;
  /** 压缩失败时的错误信息 */
  error?: string;
}

export interface NodeDataMap {
  user: UserNodeData;
  thinking: ThinkingNodeData;
  content: ContentNodeData;
  tool: ToolNodeData;
  confirm: ConfirmNodeData;
  error: ErrorNodeData;
  compaction: CompactionNodeData;
}

export interface WorkflowNode<T extends WorkflowNodeType = WorkflowNodeType> {
  id: string;
  type: T;
  status: NodeStatus;
  timestamp: number;
  data: NodeDataMap[T];
  isExpanded: boolean;
  error?: string;
  /** 当前迭代轮次序号（从 1 开始），用于前端按迭代分组展示 */
  iteration?: number;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  files: number;
}
