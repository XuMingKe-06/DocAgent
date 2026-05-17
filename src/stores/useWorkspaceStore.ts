import { create } from "zustand";
import type { Workspace } from "../types";

interface WorkspaceState {
  currentWorkspaceId: string | null;
  workspaces: Workspace[];
  isLoading: boolean;

  addWorkspace: (name: string, path: string) => string;
  switchWorkspace: (id: string) => void;
  removeWorkspace: (id: string) => void;
  loadWorkspaces: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspaceId: null,
  workspaces: [],
  isLoading: false,

  addWorkspace: (name, path) => {
    const id = `ws_${Date.now()}`;
    set((state) => ({
      workspaces: [
        ...state.workspaces,
        {
          id,
          name,
          path,
          createdAt: Date.now(),
          lastOpenedAt: Date.now(),
          isDefault: state.workspaces.length === 0,
        },
      ],
      currentWorkspaceId: state.currentWorkspaceId || id,
    }));
    return id;
  },

  switchWorkspace: (id) => {
    set({ currentWorkspaceId: id });
  },

  removeWorkspace: (id) => {
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspaceId:
        state.currentWorkspaceId === id
          ? state.workspaces[0]?.id ?? null
          : state.currentWorkspaceId,
    }));
  },

  loadWorkspaces: async () => {
    set({ isLoading: true });
    // TODO: 从 Tauri 后端加载工作区列表
    set({ isLoading: false });
  },
}));
