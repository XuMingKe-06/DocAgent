//! Token 预算管理器
//! 根据模型上下文窗口大小动态分配各部分 Token 配额，
//! 控制系统提示词、工具定义、对话历史和 LLM 响应的 Token 消耗

/// Token 预算配置
#[derive(Debug, Clone)]
pub struct TokenBudget {
    /// 系统提示词配额
    pub system_prompt: usize,
    /// 工具定义配额
    pub tool_definitions: usize,
    /// 对话历史配额
    pub conversation: usize,
    /// LLM 响应配额
    pub response: usize,
}

/// Token 预算管理器
/// 根据模型上下文窗口大小计算各部分配额
pub struct TokenBudgetManager {
    /// 模型上下文窗口大小
    context_window: usize,
    /// 计算后的预算
    budget: TokenBudget,
}

impl TokenBudgetManager {
    /// 创建新的预算管理器
    /// context_window: 模型的上下文窗口大小（Token 数）
    pub fn new(context_window: usize) -> Self {
        // 上下文窗口最小值保护
        let window = context_window.max(4096);
        let budget = Self::calculate_budget(window);
        Self {
            context_window: window,
            budget,
        }
    }

    /// 使用默认上下文窗口大小创建（128K）
    pub fn default_context() -> Self {
        Self::new(128_000)
    }

    /// 计算各部分 Token 配额
    fn calculate_budget(total: usize) -> TokenBudget {
        TokenBudget {
            // 系统提示词: 不超过总窗口的 15%
            system_prompt: (total as f64 * 0.15) as usize,
            // 工具定义: 不超过总窗口的 10%
            tool_definitions: (total as f64 * 0.10) as usize,
            // 对话历史: 不超过总窗口的 50%
            conversation: (total as f64 * 0.50) as usize,
            // LLM 响应: 预留 25%
            response: (total as f64 * 0.25) as usize,
        }
    }

    /// 获取当前预算配置
    pub fn budget(&self) -> &TokenBudget {
        &self.budget
    }

    /// 获取上下文窗口大小
    pub fn context_window(&self) -> usize {
        self.context_window
    }

    /// 根据剩余 Token 空间决定是否注入规范层
    pub fn should_inject_guides(&self, current_system_tokens: usize) -> bool {
        current_system_tokens < self.budget.system_prompt
    }

    /// 估算中文字符串的 Token 数
    /// 中文约 1 字符 = 1.5 Token，英文约 4 字符 = 1 Token
    /// 采用保守估算：1 字符 = 1 Token
    pub fn estimate_tokens(text: &str) -> usize {
        // 简化估算：字符数作为 Token 数的近似值
        // 对于混合中英文内容，这个估算偏保守但安全
        text.chars().count()
    }

    /// 判断对话历史是否超过预算
    pub fn is_conversation_over_budget(&self, current_tokens: usize) -> bool {
        current_tokens > self.budget.conversation
    }

    /// 获取对话历史可用的 Token 空间
    pub fn available_conversation_tokens(&self, current_tokens: usize) -> usize {
        self.budget.conversation.saturating_sub(current_tokens)
    }

    /// 计算滑动窗口应保留的轮数
    /// 基于剩余 Token 空间动态调整
    pub fn calculate_window_size(&self, current_tokens: usize, avg_round_tokens: usize) -> usize {
        if avg_round_tokens == 0 {
            return 6; // 默认保留 6 轮
        }
        let available = self.available_conversation_tokens(current_tokens);
        let window = available / avg_round_tokens;
        // 保留最少 2 轮，最多 10 轮
        window.clamp(2, 10)
    }
}

/// 对话历史压缩策略配置
#[derive(Debug, Clone)]
pub struct HistoryCompressionConfig {
    /// 滑动窗口大小（保留最近 N 轮完整对话）
    pub window_size: usize,
    /// 触发压缩的阈值（对话历史 Token 占预算的百分比）
    pub compression_threshold: f64,
    /// 压缩时保留最近几轮完整消息
    pub keep_recent_rounds: usize,
}

impl Default for HistoryCompressionConfig {
    fn default() -> Self {
        Self {
            window_size: 6,
            compression_threshold: 0.8,
            keep_recent_rounds: 2,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_budget() {
        let manager = TokenBudgetManager::default_context();
        let budget = manager.budget();

        // 128K 上下文窗口的预算分配
        assert_eq!(budget.system_prompt, 19200); // 15%
        assert_eq!(budget.tool_definitions, 12800); // 10%
        assert_eq!(budget.conversation, 64000); // 50%
        assert_eq!(budget.response, 32000); // 25%
    }

    #[test]
    fn test_small_context_window() {
        let manager = TokenBudgetManager::new(4096);
        let budget = manager.budget();

        // 最小上下文窗口的预算分配
        assert!(budget.system_prompt > 0);
        assert!(budget.conversation > 0);
    }

    #[test]
    fn test_should_inject_guides() {
        let manager = TokenBudgetManager::default_context();

        // 远低于配额，应注入
        assert!(manager.should_inject_guides(1000));

        // 超过配额，不应注入
        assert!(!manager.should_inject_guides(20000));
    }

    #[test]
    fn test_estimate_tokens() {
        // 英文文本
        assert!(TokenBudgetManager::estimate_tokens("Hello World") > 0);

        // 中文文本
        assert!(TokenBudgetManager::estimate_tokens("你好世界") > 0);

        // 空字符串
        assert_eq!(TokenBudgetManager::estimate_tokens(""), 0);
    }

    #[test]
    fn test_conversation_over_budget() {
        let manager = TokenBudgetManager::default_context();

        assert!(!manager.is_conversation_over_budget(1000));
        assert!(manager.is_conversation_over_budget(70000));
    }

    #[test]
    fn test_calculate_window_size() {
        let manager = TokenBudgetManager::default_context();

        // 正常情况
        let window = manager.calculate_window_size(10000, 2000);
        assert!(window >= 2);
        assert!(window <= 10);

        // 平均每轮 Token 为 0，返回默认值
        let window = manager.calculate_window_size(10000, 0);
        assert_eq!(window, 6);
    }

    #[test]
    fn test_compression_config_default() {
        let config = HistoryCompressionConfig::default();
        assert_eq!(config.window_size, 6);
        assert!((config.compression_threshold - 0.8).abs() < f64::EPSILON);
        assert_eq!(config.keep_recent_rounds, 2);
    }
}
