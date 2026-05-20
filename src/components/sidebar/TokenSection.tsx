import { SidebarSection } from "../layout/Sidebar";
import { useTokenStore } from "../../stores/useTokenStore";
import { formatTokens } from "../../utils/format";

export function TokenSection() {
  const { sessionTokens, inputTokens, outputTokens, dailyTotal, monthlyTotal, dailyBudget, monthlyBudget } = useTokenStore();

  const inputPercent = sessionTokens > 0 ? (inputTokens / sessionTokens) * 100 : 0;
  const dailyBudgetPercent = dailyBudget > 0 ? (dailyTotal / dailyBudget) * 100 : 0;
  const monthlyBudgetPercent = monthlyBudget > 0 ? (monthlyTotal / monthlyBudget) * 100 : 0;

  return (
    <SidebarSection title="Token 统计">
      <div className="flex flex-col gap-2">
        <div className="token-stat-row">
          <span className="token-label">本次会话</span>
          <span className="token-value">{formatTokens(sessionTokens)}</span>
        </div>
        <div className="token-bar-container">
          <div className="token-bar" style={{ width: `${inputPercent}%` }} />
        </div>
        <div className="token-breakdown">
          <div className="token-breakdown-item">
            <span className="token-breakdown-label">输入</span>
            <span className="token-breakdown-value text-accent">{formatTokens(inputTokens)}</span>
          </div>
          <div className="token-breakdown-item">
            <span className="token-breakdown-label">输出</span>
            <span className="token-breakdown-value text-purple">{formatTokens(outputTokens)}</span>
          </div>
        </div>

        <div className="divider" />

        <div className="token-stat-row">
          <span className="token-label">今日累计</span>
          <span className="token-value">{formatTokens(dailyTotal)}</span>
        </div>
        {dailyBudget > 0 && (
          <div className="budget-bar-container">
            <div
              className={`budget-bar ${dailyBudgetPercent > 100 ? "budget-exceeded" : dailyBudgetPercent > 80 ? "budget-warning" : ""}`}
              style={{ width: `${Math.min(dailyBudgetPercent, 100)}%` }}
            />
          </div>
        )}

        <div className="token-stat-row">
          <span className="token-label">本月累计</span>
          <span className="token-value">{formatTokens(monthlyTotal)}</span>
        </div>
        {monthlyBudget > 0 && (
          <div className="budget-bar-container">
            <div
              className={`budget-bar ${monthlyBudgetPercent > 100 ? "budget-exceeded" : monthlyBudgetPercent > 80 ? "budget-warning" : ""}`}
              style={{ width: `${Math.min(monthlyBudgetPercent, 100)}%` }}
            />
          </div>
        )}

        <div className="divider" />

        <div className="token-stat-row">
          <span className="token-label">日预算</span>
          <span className={`token-value ${dailyBudget > 0 ? "" : "text-quaternary"}`}>
            {dailyBudget > 0 ? formatTokens(dailyBudget) : "未设置"}
          </span>
        </div>
        <div className="token-stat-row">
          <span className="token-label">月预算</span>
          <span className={`token-value ${monthlyBudget > 0 ? "" : "text-quaternary"}`}>
            {monthlyBudget > 0 ? formatTokens(monthlyBudget) : "未设置"}
          </span>
        </div>
      </div>

      <style>{`
        .token-stat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
        }
        .token-label {
          color: var(--color-text-quaternary);
        }
        .token-value {
          font-family: var(--font-mono);
          font-weight: 500;
          color: var(--color-text-primary);
          font-size: 12px;
        }
        .token-bar-container {
          height: 3px;
          background: var(--color-border-light);
          border-radius: 2px;
          overflow: hidden;
          margin: 2px 0;
        }
        .token-bar {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--color-accent), var(--color-purple));
          transition: width 0.5s ease;
        }
        .token-breakdown {
          display: flex;
          gap: 12px;
        }
        .token-breakdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          font-size: 11px;
        }
        .token-breakdown-label {
          color: var(--color-text-quaternary);
        }
        .token-breakdown-value {
          font-family: var(--font-mono);
          font-weight: 500;
          font-size: 11px;
        }
        .divider {
          height: 1px;
          background: var(--color-border-light);
          margin: 4px 0;
        }
        .budget-bar-container {
          height: 2px;
          background: var(--color-border-light);
          border-radius: 2px;
          overflow: hidden;
          margin: 2px 0 4px;
        }
        .budget-bar {
          height: 100%;
          border-radius: 2px;
          background: var(--color-accent);
          transition: width 0.5s ease, background 0.3s;
        }
        .budget-bar.budget-warning {
          background: var(--color-warning);
        }
        .budget-bar.budget-exceeded {
          background: var(--color-error);
        }
      `}</style>
    </SidebarSection>
  );
}
