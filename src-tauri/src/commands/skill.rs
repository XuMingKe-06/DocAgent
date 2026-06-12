use tauri::State;

use crate::errors::CommandError;
use crate::models::skill::SkillInfo;
use crate::models::tool::ToolInfo;
use crate::AppState;

/// 列出所有 Tool（内置工具）
#[tauri::command]
pub async fn list_tools(state: State<'_, AppState>) -> Result<Vec<ToolInfo>, CommandError> {
    log::info!("list_tools: 查询所有 Tool");
    let tools = state.tool_registry.list_tools();
    log::info!("list_tools: 查询完成, 共 {} 个 Tool", tools.len());
    Ok(tools)
}

/// 列出所有 Skill（内置）
#[tauri::command]
pub async fn list_skills(state: State<'_, AppState>) -> Result<Vec<SkillInfo>, CommandError> {
    log::info!("list_skills: 查询所有 Skill");
    let skills = {
        let reg = state.skill_registry.lock().await;
        reg.list_skills()
    };
    log::info!("list_skills: 查询完成, 共 {} 个 Skill", skills.len());
    Ok(skills)
}

/// 切换 Skill 的启用/禁用状态
#[tauri::command]
pub async fn toggle_skill(
    skill_id: String,
    enabled: bool,
    state: State<'_, AppState>,
) -> Result<bool, CommandError> {
    log::info!("toggle_skill: skill_id={}, enabled={}", skill_id, enabled);

    // 切换 Skill 注册表中的状态
    let disabled_list = {
        let mut reg = state.skill_registry.lock().await;
        // 先检查技能是否存在
        if !reg.contains_skill(&skill_id) {
            return Err(CommandError::new(
                9001,
                format!("技能不存在: {}", skill_id),
            ));
        }
        if enabled {
            reg.enable_skill(&skill_id);
        } else {
            reg.disable_skill(&skill_id);
        }
        // 获取更新后的禁用列表
        reg.disabled_skills_list()
    };

    // 持久化禁用列表到设置文件
    let config = state.config.lock().await;
    let mut settings = config.load_app_settings()?;
    settings.disabled_skills = disabled_list;
    config.save_app_settings(&settings)?;

    log::info!("toggle_skill: 完成, skill_id={}, enabled={}", skill_id, enabled);
    Ok(enabled)
}
