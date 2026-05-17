// ===== 会话类型定义 =====

export interface Session {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  totalTokens: number;
}

export interface SessionSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  totalTokens: number;
}
