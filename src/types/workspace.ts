// ===== 工作区类型定义 =====

export interface Workspace {
  id: string;
  name: string;
  path: string;
  description?: string;
  createdAt: number;
  lastOpenedAt: number;
  isDefault: boolean;
}

export interface FileTreeNode {
  key: string;
  name: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  path: string;
  extension?: string;
  isModified?: boolean;
}
