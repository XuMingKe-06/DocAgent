import { create } from "zustand";
import type { FileTreeNode } from "../types";

interface FileTreeState {
  treeData: FileTreeNode[];
  expandedKeys: Set<string>;
  selectedKey: string | null;
  searchKeyword: string;
  isLoading: boolean;

  toggleNode: (key: string) => void;
  selectNode: (key: string) => void;
  setSearchKeyword: (keyword: string) => void;
  loadTree: (workspacePath: string) => Promise<void>;
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  treeData: [],
  expandedKeys: new Set(),
  selectedKey: null,
  searchKeyword: "",
  isLoading: false,

  toggleNode: (key) => {
    set((state) => {
      const next = new Set(state.expandedKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { expandedKeys: next };
    });
  },

  selectNode: (key) => {
    set({ selectedKey: key });
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  loadTree: async (_workspacePath: string) => {
    set({ isLoading: true });
    // TODO: 从 Tauri 后端加载文件树
    set({ isLoading: false });
  },
}));
