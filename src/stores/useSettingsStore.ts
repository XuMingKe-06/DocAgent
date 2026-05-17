import { create } from "zustand";
import type { AppSettings, LLMProviderConfig, Skill, PromptTemplate, SettingsTab } from "../types";

const defaultSettings: AppSettings = {
  authorName: "",
  confirmLevel: "low",
  language: "zh-CN",
  dailyTokenBudget: 0,
  monthlyTokenBudget: 0,
  overBudgetAction: "notify",
  snapshotRetention: "count-50",
};

interface SettingsState {
  settings: AppSettings;
  llmProviders: LLMProviderConfig[];
  activeProviderId: string | null;
  skills: Skill[];
  templates: PromptTemplate[];
  isSettingsOpen: boolean;
  activeSettingsTab: SettingsTab;

  updateSettings: (updates: Partial<AppSettings>) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
  toggleSkill: (id: string) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  llmProviders: [],
  activeProviderId: null,
  skills: [],
  templates: [],
  isSettingsOpen: false,
  activeSettingsTab: "llm",

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  openSettings: (tab) => {
    set({ isSettingsOpen: true, activeSettingsTab: tab || "llm" });
  },

  closeSettings: () => {
    set({ isSettingsOpen: false });
  },

  setActiveTab: (tab) => {
    set({ activeSettingsTab: tab });
  },

  toggleSkill: (id) => {
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  },

  loadSettings: async () => {
    // TODO: 从 Tauri 后端加载设置
  },
}));
