import { create } from "zustand";

interface TokenState {
  sessionTokens: number;
  inputTokens: number;
  outputTokens: number;
  dailyTotal: number;
  monthlyTotal: number;
  dailyBudget: number;
  monthlyBudget: number;

  addTokenUsage: (input: number, output: number) => void;
  resetSession: () => void;
  setDailyBudget: (budget: number) => void;
  setMonthlyBudget: (budget: number) => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  sessionTokens: 0,
  inputTokens: 0,
  outputTokens: 0,
  dailyTotal: 0,
  monthlyTotal: 0,
  dailyBudget: 0,
  monthlyBudget: 0,

  addTokenUsage: (input, output) => {
    set((state) => ({
      inputTokens: state.inputTokens + input,
      outputTokens: state.outputTokens + output,
      sessionTokens: state.sessionTokens + input + output,
      dailyTotal: state.dailyTotal + input + output,
      monthlyTotal: state.monthlyTotal + input + output,
    }));
  },

  resetSession: () => {
    set({ sessionTokens: 0, inputTokens: 0, outputTokens: 0 });
  },

  setDailyBudget: (budget) => set({ dailyBudget: budget }),
  setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),
}));
