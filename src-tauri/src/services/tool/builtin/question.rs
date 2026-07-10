//! Question 工具：向用户提问并等待回答
//! Agent 可在需要用户决策或澄清时调用此工具
//! 通过 AGENT_QUESTION 事件推送问题到前端，前端通过 submit_question_answer 命令回复

use std::sync::Arc;

use async_trait::async_trait;
use serde_json::{json, Value};
use tauri::Emitter;

use crate::errors::TOOL_INVALID_PARAMS;
use crate::events::types::{QuestionItem, QuestionOption, QuestionPayload, AGENT_QUESTION};
use crate::models::tool::ToolResult;
use crate::services::tool::trait_def::Tool;

/// 用户对 question 工具的答案
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionAnswer {
    /// 问题 ID（与 QuestionPayload.question_id 对应）
    pub question_id: String,
    /// 每个问题的答案列表
    pub answers: Vec<QuestionItemAnswer>,
}

/// 单个问题的答案
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionItemAnswer {
    /// 问题索引（对应 QuestionPayload.questions 的下标）
    pub question_index: usize,
    /// 用户选择的选项 label 列表
    pub selected_options: Vec<String>,
}

/// Question 工具的答案通道（按 question_id 隔离）
/// 与 confirm_channels 模式一致：工具创建 oneshot::Sender 存入，
/// 前端通过 submit_question_answer 命令取出 Sender 发送答案
pub type QuestionChannels = Arc<
    tokio::sync::Mutex<
        std::collections::HashMap<String, tokio::sync::oneshot::Sender<QuestionAnswer>>,
    >,
>;

/// Question 工具：向用户提问并等待回答
/// Agent 可在需要用户决策或澄清时调用此工具
/// 通过 AGENT_QUESTION 事件推送问题到前端，等待前端通过 submit_question_answer 命令回复
pub struct QuestionTool {
    /// 答案通道（与 submit_question_answer 命令共享）
    question_channels: QuestionChannels,
    /// Tauri AppHandle，用于发射 AGENT_QUESTION 事件
    app_handle: Option<tauri::AppHandle<tauri::Wry>>,
}

impl QuestionTool {
    /// 创建 QuestionTool 实例
    /// question_channels: 与 submit_question_answer 命令共享的通道
    /// app_handle: Tauri 应用句柄（用于发射事件，None 时仅记录日志）
    pub fn new(
        question_channels: QuestionChannels,
        app_handle: Option<tauri::AppHandle<tauri::Wry>>,
    ) -> Self {
        Self {
            question_channels,
            app_handle,
        }
    }
}

#[async_trait]
impl Tool for QuestionTool {
    fn tool_name(&self) -> &str {
        "question"
    }

    fn description(&self) -> &str {
        "向用户提出问题并等待回答。适用于需要用户决策、澄清需求或选择方案时。\
         最多可同时提出 4 个问题，每个问题提供 2-4 个选项。用户回答后继续执行。"
    }

    fn category(&self) -> &str {
        "agent"
    }

    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "description": "问题列表（1-4 个）",
                    "minItems": 1,
                    "maxItems": 4,
                    "items": {
                        "type": "object",
                        "properties": {
                            "header": {
                                "type": "string",
                                "description": "短标签（最多 12 字符）",
                                "maxLength": 12
                            },
                            "question": {
                                "type": "string",
                                "description": "完整问题文本"
                            },
                            "options": {
                                "type": "array",
                                "description": "选项列表（2-4 个）",
                                "minItems": 2,
                                "maxItems": 4,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "label": { "type": "string", "description": "选项标签" },
                                        "description": { "type": "string", "description": "选项描述" }
                                    },
                                    "required": ["label", "description"]
                                }
                            },
                            "multiSelect": {
                                "type": "boolean",
                                "description": "是否允许多选（默认 false）",
                                "default": false
                            }
                        },
                        "required": ["header", "question", "options"]
                    }
                }
            },
            "required": ["questions"]
        })
    }

    async fn execute(&self, params: Value) -> ToolResult {
        let start = std::time::Instant::now();

        // 1. 提取 questions 数组（必填）
        let questions_raw = match params.get("questions").and_then(|v| v.as_array()) {
            Some(arr) if !arr.is_empty() => arr,
            _ => {
                return ToolResult {
                    success: false,
                    output: None,
                    error: Some("缺少 questions 参数或为空".to_string()),
                    duration_ms: start.elapsed().as_millis() as u64,
                    error_code: Some(TOOL_INVALID_PARAMS),
                };
            }
        };

        // 2. 验证问题数量（1-4）
        if questions_raw.len() > 4 {
            return ToolResult {
                success: false,
                output: None,
                error: Some(format!(
                    "问题数量超过限制（最多 4 个，实际 {}）",
                    questions_raw.len()
                )),
                duration_ms: start.elapsed().as_millis() as u64,
                error_code: Some(TOOL_INVALID_PARAMS),
            };
        }

        // 3. 解析每个问题并验证
        let mut question_items: Vec<QuestionItem> = Vec::new();
        for (idx, q) in questions_raw.iter().enumerate() {
            let header = q
                .get("header")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let question = q
                .get("question")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let multi_select = q
                .get("multiSelect")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            // 提取选项
            let options_raw = match q.get("options").and_then(|v| v.as_array()) {
                Some(arr) if arr.len() >= 2 && arr.len() <= 4 => arr,
                _ => {
                    return ToolResult {
                        success: false,
                        output: None,
                        error: Some(format!("问题 {} 的选项数量必须在 2-4 个之间", idx)),
                        duration_ms: start.elapsed().as_millis() as u64,
                        error_code: Some(TOOL_INVALID_PARAMS),
                    };
                }
            };

            let mut options: Vec<QuestionOption> = Vec::new();
            for opt in options_raw {
                let label = opt
                    .get("label")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let description = opt
                    .get("description")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                options.push(QuestionOption { label, description });
            }

            question_items.push(QuestionItem {
                header,
                question,
                options,
                multi_select,
            });
        }

        // 4. 生成 question_id
        let question_id = uuid::Uuid::new_v4().to_string();

        // 5. 从 params 获取 session_id
        let session_id = params
            .get("_session_id")
            .and_then(|v| v.as_str())
            .unwrap_or("default")
            .to_string();

        // 6. 创建 oneshot channel
        let (tx, rx) = tokio::sync::oneshot::channel::<QuestionAnswer>();

        // 7. 存入 question_channels
        {
            let mut channels = self.question_channels.lock().await;
            channels.insert(question_id.clone(), tx);
        }

        // 8. 发射 AGENT_QUESTION 事件
        let payload = QuestionPayload {
            session_id: session_id.clone(),
            question_id: question_id.clone(),
            questions: question_items.clone(),
        };
        if let Some(handle) = &self.app_handle {
            if let Err(e) = handle.emit(AGENT_QUESTION, payload) {
                log::warn!("question 工具: 发射 AGENT_QUESTION 事件失败: {}", e);
            }
        } else {
            log::debug!("question 工具: app_handle 未设置，事件未发射");
        }

        // 9. 等待用户回答（5 分钟超时）
        let timeout_duration = std::time::Duration::from_secs(300);
        match tokio::time::timeout(timeout_duration, rx).await {
            Ok(Ok(answer)) => {
                // 收到答案
                let answers: Vec<Value> = answer
                    .answers
                    .iter()
                    .map(|a| {
                        json!({
                            "questionIndex": a.question_index,
                            "selectedOptions": a.selected_options,
                        })
                    })
                    .collect();

                ToolResult {
                    success: true,
                    output: Some(json!({
                        "questionId": answer.question_id,
                        "answers": answers,
                    })),
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                    error_code: None,
                }
            }
            Ok(Err(_)) => {
                // 接收端关闭（Agent 被停止）
                ToolResult {
                    success: true,
                    output: Some(json!({
                        "questionId": question_id,
                        "answers": [],
                        "note": "问题已被取消",
                    })),
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                    error_code: None,
                }
            }
            Err(_) => {
                // 超时（5 分钟无回答）
                log::warn!(
                    "question 工具: 等待用户回答超时, question_id={}",
                    question_id
                );
                // 清理 channel
                let mut channels = self.question_channels.lock().await;
                channels.remove(&question_id);

                ToolResult {
                    success: true,
                    output: Some(json!({
                        "questionId": question_id,
                        "answers": [],
                        "note": "等待用户回答超时(5分钟)，返回空答案",
                    })),
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                    error_code: None,
                }
            }
        }
    }
}
