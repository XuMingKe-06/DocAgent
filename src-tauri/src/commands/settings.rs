use tauri::State;

use crate::config::app_settings::AppSettings;
use crate::errors::CommandError;
use crate::AppState;

/// 获取应用设置
#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<AppSettings, CommandError> {
    log::info!("获取应用设置");
    let config = state.config.lock().await;
    let settings = config.load_app_settings().map_err(|e| {
        log::error!("加载应用设置失败: {}", e);
        e
    })?;
    log::info!("获取应用设置成功");
    Ok(settings)
}

/// 更新应用设置，接收部分 JSON 合并到现有设置
#[tauri::command]
pub async fn update_settings(
    settings: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<(), CommandError> {
    log::info!("更新应用设置");
    let config = state.config.lock().await;
    let current = config.load_app_settings().map_err(|e| {
        log::error!("加载应用设置失败: {}", e);
        e
    })?;

    // 将现有设置序列化为 JSON，与传入的 JSON 合并，再反序列化回来
    let mut current_json = serde_json::to_value(&current).map_err(|e| {
        log::error!("序列化应用设置失败: {}", e);
        e
    })?;
    json_merge(&mut current_json, &settings);
    let merged: AppSettings = serde_json::from_value(current_json).map_err(|e| {
        log::error!("反序列化合并后的设置失败: {}", e);
        e
    })?;

    config.save_app_settings(&merged).map_err(|e| {
        log::error!("保存应用设置失败: {}", e);
        e
    })?;
    log::info!("更新应用设置成功");
    Ok(())
}

/// 递归合并 JSON 对象，source 中的字段覆盖 target 中的同名字段
fn json_merge(target: &mut serde_json::Value, source: &serde_json::Value) {
    match (target, source) {
        (serde_json::Value::Object(t), serde_json::Value::Object(s)) => {
            for (key, value) in s {
                let entry = t.entry(key.clone()).or_insert(serde_json::Value::Null);
                json_merge(entry, value);
            }
        }
        (t, s) => {
            *t = s.clone();
        }
    }
}

/// 导出应用配置为 JSON 字符串
#[tauri::command]
pub async fn export_config(
    include_secrets: Option<bool>,
    state: State<'_, AppState>,
) -> Result<String, CommandError> {
    log::info!("导出应用配置");
    let config = state.config.lock().await;
    let settings = config.load_app_settings().map_err(|e| {
        log::error!("加载应用设置失败: {}", e);
        e
    })?;

    // 加载 LLM 配置
    let llm_config = config.load_llm_config().map_err(|e| {
        log::error!("加载 LLM 配置失败: {}", e);
        e
    })?;

    let include_secrets = include_secrets.unwrap_or(false);

    if include_secrets {
        // 包含 LLM 配置（含 API Key）
        let export_data = serde_json::json!({
            "settings": settings,
            "llm": llm_config,
        });
        let json = serde_json::to_string_pretty(&export_data)?;
        Ok(json)
    } else {
        // 不包含敏感信息，将 API Key 脱敏
        let mut llm_json = serde_json::to_value(&llm_config)?;
        // 脱敏处理：将 apiKeyEncrypted 替换为掩码
        if let Some(providers) = llm_json.get_mut("providers").and_then(|p| p.as_array_mut()) {
            for provider in providers.iter_mut() {
                if let Some(api_key) = provider.get_mut("apiKeyEncrypted") {
                    *api_key = serde_json::Value::String("********".to_string());
                }
            }
        }
        let export_data = serde_json::json!({
            "settings": settings,
            "llm": llm_json,
        });
        let json = serde_json::to_string_pretty(&export_data)?;
        Ok(json)
    }
}

/// 从 JSON 字符串导入应用配置
#[tauri::command]
pub async fn import_config(
    config_json: String,
    overwrite: Option<bool>,
    state: State<'_, AppState>,
) -> Result<(), CommandError> {
    log::info!("导入应用配置");
    let overwrite = overwrite.unwrap_or(false);

    let parsed: serde_json::Value = serde_json::from_str(&config_json).map_err(|e| {
        CommandError::config(crate::errors::CONFIG_INVALID_FORMAT, format!("JSON 格式无效: {}", e))
    })?;

    let config = state.config.lock().await;

    // 导入应用设置
    if let Some(settings_json) = parsed.get("settings") {
        let imported_settings: AppSettings = serde_json::from_value(settings_json.clone()).map_err(|e| {
            CommandError::config(crate::errors::CONFIG_INVALID_FORMAT, format!("设置格式无效: {}", e))
        })?;

        if overwrite {
            config.save_app_settings(&imported_settings)?;
        } else {
            // 合并模式：将导入的设置合并到现有设置
            let current = config.load_app_settings()?;
            let mut current_json = serde_json::to_value(&current)?;
            let imported_json = serde_json::to_value(&imported_settings)?;
            json_merge(&mut current_json, &imported_json);
            let merged: AppSettings = serde_json::from_value(current_json)?;
            config.save_app_settings(&merged)?;
        }
    }

    // 导入 LLM 配置
    if let Some(llm_json) = parsed.get("llm") {
        let imported_llm: crate::config::llm_config::LlmConfig = serde_json::from_value(llm_json.clone()).map_err(|e| {
            CommandError::config(crate::errors::CONFIG_INVALID_FORMAT, format!("LLM 配置格式无效: {}", e))
        })?;

        if overwrite {
            config.save_llm_config(&imported_llm)?;
        } else {
            let current = config.load_llm_config()?;
            let mut current_json = serde_json::to_value(&current)?;
            json_merge(&mut current_json, llm_json);
            let merged: crate::config::llm_config::LlmConfig = serde_json::from_value(current_json)?;
            config.save_llm_config(&merged)?;
        }
    }

    log::info!("导入应用配置成功");
    Ok(())
}
