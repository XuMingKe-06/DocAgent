import { SidebarSection } from "../layout/Sidebar";
import { useTokenStore } from "../../stores/useTokenStore";
import { formatTokens } from "../../utils/format";

export function TokenSection() {
  const { sessionTokens, inputTokens, outputTokens, dailyTotal, monthlyTotal, dailyBudget, monthlyBudget } = useTokenStore();

  const inputPercent = sessionTokens > 0 ? (inputTokens / sessionTokens) * 100 : 0;

  return (
    <SidebarSection title="Token 统计">
      <div className="flex flex-col gap-2">
        {/* 本次会话 */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-tertiary">本次会话</span>
          <span className="font-mono font-medium text-text-primary">{formatTokens(sessionTokens)}</span>
        </div>
        <div className="h-1 bg-border-light rounded-[2px] overflow-hidden">
          <div className="h-full rounded-[2px] bg-accent transition-all duration-500" style={{ width: `${inputPercent}%` }} />
        </div>

        {/* 输入 */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">输入</span>
          <span className="text-[11px] font-mono font-medium text-accent">{formatTokens(inputTokens)}</span>
        </div>

        {/* 输出 */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">输出</span>
          <span className="text-[11px] font-mono font-medium text-[#6C5CE7]">{formatTokens(outputTokens)}</span>
        </div>

        {/* 分隔线 */}
        <div className="h-[1px] bg-border my-1" />

        {/* 今日累计 */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-tertiary">今日累计</span>
          <span className="font-mono font-medium text-text-primary">{formatTokens(dailyTotal)}</span>
        </div>

        {/* 本月累计 */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-tertiary">本月累计</span>
          <span className="font-mono font-medium text-text-primary">{formatTokens(monthlyTotal)}</span>
        </div>

        {/* 分隔线 */}
        <div className="h-[1px] bg-border my-1" />

        {/* 预算 */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-tertiary">日预算</span>
          <span className="font-mono text-text-tertiary">
            {dailyBudget > 0 ? formatTokens(dailyBudget) : "未设置"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-tertiary">月预算</span>
          <span className="font-mono text-text-tertiary">
            {monthlyBudget > 0 ? formatTokens(monthlyBudget) : "未设置"}
          </span>
        </div>
      </div>
    </SidebarSection>
  );
}
