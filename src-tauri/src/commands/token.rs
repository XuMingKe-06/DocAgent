use tauri::State;

use crate::db::token_repo;
use crate::errors::CommandError;
use crate::AppState;

use serde::Serialize;

/// 预算状态
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BudgetStatus {
    /// 日预算上限，0 表示不限制
    pub daily_limit: u64,
    /// 今日已使用 Token 数
    pub daily_used: u64,
    /// 月预算上限，0 表示不限制
    pub monthly_limit: u64,
    /// 本月已使用 Token 数
    pub monthly_used: u64,
    /// 超出预算行为
    pub exceed_action: String,
    /// 是否已超出日预算
    pub is_daily_exceeded: bool,
    /// 是否已超出月预算
    pub is_monthly_exceeded: bool,
}

/// 获取最近 N 天的 Token 用量趋势
#[tauri::command]
pub async fn get_token_usage_trend(
    workspace_id: Option<String>,
    days: Option<u32>,
    state: State<'_, AppState>,
) -> Result<Vec<token_repo::DailyUsageItem>, CommandError> {
    let days = days.unwrap_or(30).min(90);
    let conn = state.db.conn()?;
    let wid = workspace_id.as_deref();
    let trend = token_repo::get_usage_trend(&conn, wid, days);
    Ok(trend)
}

/// 按 Provider/Model 分组获取 Token 用量
#[tauri::command]
pub async fn get_token_provider_usage(
    start_date: Option<String>,
    end_date: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<token_repo::ProviderUsageItem>, CommandError> {
    let conn = state.db.conn()?;
    let usage = token_repo::get_provider_usage(
        &conn,
        start_date.as_deref(),
        end_date.as_deref(),
    );
    Ok(usage)
}

/// 获取 Token 用量概览
#[tauri::command]
pub async fn get_token_usage_overview(
    workspace_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<token_repo::TokenUsageOverview, CommandError> {
    let conn = state.db.conn()?;
    let overview = token_repo::get_usage_overview(&conn, workspace_id.as_deref());
    Ok(overview)
}

/// 检查 Token 预算使用情况
#[tauri::command]
pub async fn check_token_budget(
    state: State<'_, AppState>,
) -> Result<BudgetStatus, CommandError> {
    let config = state.config.lock().await;
    let settings = config.load_app_settings()?;
    drop(config); // 尽早释放配置锁

    let conn = state.db.conn()?;
    let overview = token_repo::get_usage_overview(&conn, None);

    let daily_limit = settings.token_budget.daily_limit;
    let monthly_limit = settings.token_budget.monthly_limit;
    // 将 i64 转换为 u64（Token 用量不会为负数）
    let daily_used = (overview.today_input + overview.today_output) as u64;
    let monthly_used = (overview.month_input + overview.month_output) as u64;

    let is_daily_exceeded = daily_limit > 0 && daily_used > daily_limit;
    let is_monthly_exceeded = monthly_limit > 0 && monthly_used > monthly_limit;

    // 将 ExceedAction 枚举转换为字符串
    let exceed_action = match settings.token_budget.exceed_action {
        crate::config::app_settings::ExceedAction::Warn => "warn".to_string(),
        crate::config::app_settings::ExceedAction::Block => "block".to_string(),
        crate::config::app_settings::ExceedAction::Fallback => "fallback".to_string(),
    };

    Ok(BudgetStatus {
        daily_limit,
        daily_used,
        monthly_limit,
        monthly_used,
        exceed_action,
        is_daily_exceeded,
        is_monthly_exceeded,
    })
}
