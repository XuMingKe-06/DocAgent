//! LSP Tauri 命令:提供前端调用 LSP 功能的接口

use crate::AppState;
use tauri::State;

/// 获取所有 LSP 服务器状态
#[tauri::command]
pub async fn lsp_get_status(
    state: State<'_, AppState>,
) -> Result<Vec<crate::models::lsp::LspServerInfo>, crate::errors::CommandError> {
    let statuses = state.lsp_manager.get_all_status().await;
    Ok(statuses)
}

/// 重启指定语言的 LSP 服务器
#[tauri::command]
pub async fn lsp_restart_server(
    state: State<'_, AppState>,
    language: String,
) -> Result<(), crate::errors::CommandError> {
    // 先停止现有服务器
    state.lsp_manager.stop(&language).await?;
    // 重新启动(会自动使用已注册的配置)
    state.lsp_manager.get_or_start(&language).await?;
    log::info!("LSP 服务器已重启: language={}", language);
    Ok(())
}

/// 停止所有 LSP 服务器
#[tauri::command]
pub async fn lsp_stop_all(state: State<'_, AppState>) -> Result<(), crate::errors::CommandError> {
    state.lsp_manager.stop_all().await?;
    log::info!("所有 LSP 服务器已停止");
    Ok(())
}
