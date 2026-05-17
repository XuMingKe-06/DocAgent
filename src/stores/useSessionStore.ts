import { create } from "zustand";
import type { Session } from "../types";

interface SessionState {
  currentSessionId: string | null;
  sessions: Session[];
  isLoading: boolean;

  createSession: (title?: string) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  loadSessions: (workspaceId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSessionId: null,
  sessions: [],
  isLoading: false,

  createSession: (title) => {
    const id = `session_${Date.now()}`;
    const now = Date.now();
    set((state) => ({
      sessions: [
        {
          id,
          title: title || `新会话 ${new Date().toLocaleTimeString()}`,
          workspaceId: "",
          createdAt: now,
          updatedAt: now,
          messageCount: 0,
          totalTokens: 0,
        },
        ...state.sessions,
      ],
      currentSessionId: id,
    }));
    return id;
  },

  switchSession: (sessionId) => {
    set({ currentSessionId: sessionId });
  },

  deleteSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSessionId:
        state.currentSessionId === sessionId
          ? state.sessions[0]?.id ?? null
          : state.currentSessionId,
    }));
  },

  updateSessionTitle: (sessionId, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      ),
    }));
  },

  loadSessions: async (_workspaceId: string) => {
    set({ isLoading: true });
    // TODO: 从 Tauri 后端加载会话列表
    set({ isLoading: false });
  },
}));
