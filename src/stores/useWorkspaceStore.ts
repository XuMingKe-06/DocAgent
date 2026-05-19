import { create } from "zustand";
import type { WorkspaceInfo } from "../types";
import * as tauriCmd from "../services/tauri";

interface WorkspaceState {
  currentWorkspaceId: string | null;
  workspaces: WorkspaceInfo[];
  isLoading: boolean;

  addWorkspace: (path: string, name?: string) => Promise<string>;
  switchWorkspace: (id: string) => Promise<void>;
  removeWorkspace: (id: string) => Promise<void>;
  loadWorkspaces: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspaceId: null,
  workspaces: [],
  isLoading: false,

  // 添加工作区，调用后端 API
  addWorkspace: async (path, name) => {
    try {
      const workspace = await tauriCmd.addWorkspace(path, name);
      const newCurrentId = get().currentWorkspaceId || workspace.id;
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        currentWorkspaceId: newCurrentId,
      }));
      // 同步后端活动工作区状态，确保文件监听启动
      if (newCurrentId) {
        await tauriCmd.setActiveWorkspace(newCurrentId).catch((err) => {
          console.warn("[WorkspaceStore] 同步活动工作区失败:", err);
        });
      }
      return workspace.id;
    } catch (error) {
      console.error("[WorkspaceStore] 添加工作区失败:", error);
      throw error;
    }
  },

  // 切换工作区，调用后端 API
  switchWorkspace: async (id) => {
    try {
      await tauriCmd.setActiveWorkspace(id);
      set({ currentWorkspaceId: id });
    } catch (error) {
      console.error("[WorkspaceStore] 切换工作区失败:", error);
    }
  },

  // 移除工作区，调用后端 API
  removeWorkspace: async (id) => {
    try {
      await tauriCmd.removeWorkspace(id);
      let newCurrentId: string | null = null;
      set((state) => {
        // 先过滤得到剩余列表，再从剩余列表中取回退值，避免回退到已删除的工作区
        const remaining = state.workspaces.filter((w) => w.id !== id);
        newCurrentId =
          state.currentWorkspaceId === id
            ? remaining[0]?.id ?? null
            : state.currentWorkspaceId;
        return {
          workspaces: remaining,
          currentWorkspaceId: newCurrentId,
        };
      });
      // 同步后端活动工作区状态，确保文件监听切换
      if (newCurrentId) {
        await tauriCmd.setActiveWorkspace(newCurrentId).catch((err) => {
          console.warn("[WorkspaceStore] 同步活动工作区失败:", err);
        });
      }
    } catch (error) {
      console.error("[WorkspaceStore] 移除工作区失败:", error);
    }
  },

  // 从后端加载工作区列表
  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const workspaces = await tauriCmd.listWorkspaces();
      const activeWorkspace = workspaces.find((w) => w.isActive);
      const currentId = activeWorkspace?.id ?? workspaces[0]?.id ?? null;
      set({
        workspaces,
        currentWorkspaceId: currentId,
        isLoading: false,
      });
      // 同步后端活动工作区状态，确保文件监听启动
      if (currentId) {
        await tauriCmd.setActiveWorkspace(currentId).catch((err) => {
          console.warn("[WorkspaceStore] 同步活动工作区失败:", err);
        });
      }
    } catch (error) {
      console.error("[WorkspaceStore] 加载工作区列表失败:", error);
      set({ isLoading: false });
    }
  },
}));
