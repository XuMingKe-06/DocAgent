// ===== 设置相关类型定义 =====

export type LLMProvider = "openai" | "anthropic" | "google" | "local" | "custom";

export type ConfirmLevel = "auto" | "low" | "medium" | "high";

export type SettingsTab = "llm" | "workspace" | "skill" | "template" | "general";

export interface LLMProviderConfig {
  id: string;
  provider: LLMProvider;
  name: string;
  apiKey: string;
  baseUrl?: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  enabled: boolean;
  latency?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  label: string;
  defaultValue?: unknown;
  options?: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  variables?: TemplateVariable[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  authorName: string;
  confirmLevel: ConfirmLevel;
  language: "zh-CN" | "en-US";
  dailyTokenBudget: number;
  monthlyTokenBudget: number;
  overBudgetAction: "notify" | "pause" | "switch-model";
  snapshotRetention: "count-50" | "days-30";
}
