use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde_json::{json, Value};

use crate::models::handler::HandlerResult;
use crate::services::document::DocumentService;
use super::registry::Handler;

/// 将相对路径解析为绝对路径
fn resolve_path(path: &str, workspace_root: &str) -> String {
    if path.is_empty() {
        return path.to_string();
    }
    let p = std::path::Path::new(path);
    if p.is_absolute() {
        return path.to_string();
    }
    let root = std::path::Path::new(workspace_root);
    root.join(path).to_string_lossy().to_string()
}

/// 执行 read 操作的通用逻辑
async fn execute_read(
    doc_service: &DocumentService,
    doc_type: &str,
    params: Value,
) -> HandlerResult {
    let start = Instant::now();
    let file_path = params["path"].as_str().unwrap_or("");
    let workspace_root = params["workspace_root"].as_str().unwrap_or("");
    let resolved_path = resolve_path(file_path, workspace_root);

    let mut sidecar_params = json!({
        "path": resolved_path,
    });

    // read 操作的通用参数
    if !params["include_formatting"].is_null() {
        sidecar_params["include_formatting"] = json!(params["include_formatting"].as_bool().unwrap_or(false));
    }

    // Excel read 专用参数
    if let Some(sheet) = params["sheet"].as_str() {
        sidecar_params["sheet"] = json!(sheet);
    }
    if let Some(range) = params["range"].as_str() {
        sidecar_params["range"] = json!(range);
    }

    match doc_service.process("read", doc_type, sidecar_params).await {
        Ok(data) => HandlerResult {
            success: true,
            output: Some(data),
            error: None,
            duration_ms: start.elapsed().as_millis() as u64,
        },
        Err(e) => HandlerResult {
            success: false,
            output: None,
            error: Some(e.message),
            duration_ms: start.elapsed().as_millis() as u64,
        },
    }
}

/// 执行 convert 操作的通用逻辑
async fn execute_convert(
    doc_service: &DocumentService,
    doc_type: &str,
    params: Value,
) -> HandlerResult {
    let start = Instant::now();
    let file_path = params["path"].as_str().unwrap_or("");
    let target_format = params["target_format"].as_str().unwrap_or("pdf");
    let output_path = params["output_path"].as_str().unwrap_or("");
    let workspace_root = params["workspace_root"].as_str().unwrap_or("");

    let resolved_source = resolve_path(file_path, workspace_root);

    let output_path = if output_path.is_empty() {
        // 自动生成输出路径：与源文件同目录（源文件已通过 resolve_path 解析为工作区内的绝对路径）
        let source_path = std::path::Path::new(&resolved_source);
        let stem = source_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");
        let new_filename = format!("{}.{}", stem, target_format);
        source_path
            .parent()
            .map(|p| p.join(&new_filename).to_string_lossy().to_string())
            .unwrap_or(new_filename)
    } else {
        resolve_path(output_path, workspace_root)
    };

    let mut sidecar_params = json!({
        "path": resolved_source,
        "output_path": output_path,
        "format": target_format,
    });

    // Excel convert 专用参数
    if let Some(sheet) = params["sheet"].as_str() {
        sidecar_params["sheet"] = json!(sheet);
    }

    match doc_service.process("convert", doc_type, sidecar_params).await {
        Ok(data) => HandlerResult {
            success: true,
            output: Some(data),
            error: None,
            duration_ms: start.elapsed().as_millis() as u64,
        },
        Err(e) => HandlerResult {
            success: false,
            output: None,
            error: Some(e.message),
            duration_ms: start.elapsed().as_millis() as u64,
        },
    }
}

/// 执行 analyze 操作的通用逻辑
async fn execute_analyze(
    doc_service: &DocumentService,
    doc_type: &str,
    params: Value,
) -> HandlerResult {
    let start = Instant::now();
    let file_path = params["path"].as_str().unwrap_or("");
    let workspace_root = params["workspace_root"].as_str().unwrap_or("");
    let resolved_path = resolve_path(file_path, workspace_root);

    let sidecar_params = json!({
        "path": resolved_path,
    });

    match doc_service.process("analyze", doc_type, sidecar_params).await {
        Ok(data) => HandlerResult {
            success: true,
            output: Some(data),
            error: None,
            duration_ms: start.elapsed().as_millis() as u64,
        },
        Err(e) => HandlerResult {
            success: false,
            output: None,
            error: Some(e.message),
            duration_ms: start.elapsed().as_millis() as u64,
        },
    }
}

/// 注册所有内置处理器
pub fn register_builtin_handlers(
    registry: &mut super::registry::HandlerRegistry,
    doc_service: Arc<DocumentService>,
) {
    log::info!("开始注册内置处理器");
    registry.register(Box::new(DocxHandler::new(doc_service.clone())));
    registry.register(Box::new(XlsxHandler::new(doc_service.clone())));
    registry.register(Box::new(PptxHandler::new(doc_service.clone())));
    registry.register(Box::new(PdfHandler::new(doc_service.clone())));
    registry.register(Box::new(CodeInterpreterHandler::new(doc_service)));
    log::info!("内置处理器注册完成, 共注册 5 个处理器");
}

// ============================================================================
// DocxHandler - Word 文档处理器
// ============================================================================

/// Word 文档处理器
/// 聚合 read/convert/analyze 三种操作
struct DocxHandler {
    doc_service: Arc<DocumentService>,
}

impl DocxHandler {
    fn new(doc_service: Arc<DocumentService>) -> Self {
        Self { doc_service }
    }
}

#[async_trait]
impl Handler for DocxHandler {
    fn handler_name(&self) -> &str { "docx_handler" }
    fn description(&self) -> &str {
        "Word文档(.docx)处理器，支持读取、格式转换、分析三种操作。转换支持docx/pdf/md/txt/html等格式。"
    }
    fn category(&self) -> &str { "document" }
    fn is_builtin(&self) -> bool { true }
    fn supported_types(&self) -> Vec<String> {
        vec!["docx".into()]
    }
    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["read", "convert", "analyze"],
                    "description": "操作类型: read=读取文档, convert=格式转换, analyze=分析文档"
                },
                "path": {
                    "type": "string",
                    "description": "文件路径（相对于工作区）"
                },
                "include_formatting": {
                    "type": "boolean",
                    "description": "[read] 是否包含格式信息，默认 false",
                    "default": false
                },
                "target_format": {
                    "type": "string",
                    "enum": ["docx", "xlsx", "pptx", "pdf", "md", "txt", "csv", "html"],
                    "description": "[convert] 目标格式"
                },
                "output_path": {
                    "type": "string",
                    "description": "[convert] 输出文件路径（可选，默认自动生成）"
                }
            },
            "required": ["action", "path"]
        })
    }
    async fn execute(&self, params: Value) -> HandlerResult {
        let action = params["action"].as_str().unwrap_or("");
        match action {
            "read" => execute_read(&self.doc_service, "docx", params).await,
            "convert" => execute_convert(&self.doc_service, "docx", params).await,
            "analyze" => execute_analyze(&self.doc_service, "docx", params).await,
            _ => HandlerResult {
                success: false,
                output: None,
                error: Some(format!("DocxHandler 不支持的操作类型: {}", action)),
                duration_ms: 0,
            },
        }
    }
}

// ============================================================================
// XlsxHandler - Excel 文档处理器
// ============================================================================

/// Excel 文档处理器
/// 聚合 read/convert/analyze 三种操作
struct XlsxHandler {
    doc_service: Arc<DocumentService>,
}

impl XlsxHandler {
    fn new(doc_service: Arc<DocumentService>) -> Self {
        Self { doc_service }
    }
}

#[async_trait]
impl Handler for XlsxHandler {
    fn handler_name(&self) -> &str { "xlsx_handler" }
    fn description(&self) -> &str {
        "Excel文档(.xlsx)处理器，支持读取、格式转换、分析三种操作。转换支持xlsx/pdf/csv/html等格式。"
    }
    fn category(&self) -> &str { "document" }
    fn is_builtin(&self) -> bool { true }
    fn supported_types(&self) -> Vec<String> {
        vec!["xlsx".into()]
    }
    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["read", "convert", "analyze"],
                    "description": "操作类型: read=读取文档, convert=格式转换, analyze=分析文档"
                },
                "path": {
                    "type": "string",
                    "description": "文件路径（相对于工作区）"
                },
                "sheet": {
                    "type": "string",
                    "description": "[read/convert] 工作表名称"
                },
                "range": {
                    "type": "string",
                    "description": "[read] 单元格范围，如 A1:D10"
                },
                "include_formatting": {
                    "type": "boolean",
                    "description": "[read] 是否包含格式信息，默认 false",
                    "default": false
                },
                "target_format": {
                    "type": "string",
                    "enum": ["docx", "xlsx", "pptx", "pdf", "md", "txt", "csv", "html"],
                    "description": "[convert] 目标格式"
                },
                "output_path": {
                    "type": "string",
                    "description": "[convert] 输出文件路径（可选，默认自动生成）"
                }
            },
            "required": ["action", "path"]
        })
    }
    async fn execute(&self, params: Value) -> HandlerResult {
        let action = params["action"].as_str().unwrap_or("");
        match action {
            "read" => execute_read(&self.doc_service, "xlsx", params).await,
            "convert" => execute_convert(&self.doc_service, "xlsx", params).await,
            "analyze" => execute_analyze(&self.doc_service, "xlsx", params).await,
            _ => HandlerResult {
                success: false,
                output: None,
                error: Some(format!("XlsxHandler 不支持的操作类型: {}", action)),
                duration_ms: 0,
            },
        }
    }
}

// ============================================================================
// PptxHandler - PPT 文档处理器
// ============================================================================

/// PPT 文档处理器
/// 聚合 read/convert/analyze 三种操作
struct PptxHandler {
    doc_service: Arc<DocumentService>,
}

impl PptxHandler {
    fn new(doc_service: Arc<DocumentService>) -> Self {
        Self { doc_service }
    }
}

#[async_trait]
impl Handler for PptxHandler {
    fn handler_name(&self) -> &str { "pptx_handler" }
    fn description(&self) -> &str {
        "PPT演示文稿(.pptx)处理器，支持读取、格式转换、分析三种操作。转换支持pptx/pdf等格式。"
    }
    fn category(&self) -> &str { "document" }
    fn is_builtin(&self) -> bool { true }
    fn supported_types(&self) -> Vec<String> {
        vec!["pptx".into()]
    }
    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["read", "convert", "analyze"],
                    "description": "操作类型: read=读取文档, convert=格式转换, analyze=分析文档"
                },
                "path": {
                    "type": "string",
                    "description": "文件路径（相对于工作区）"
                },
                "target_format": {
                    "type": "string",
                    "enum": ["docx", "xlsx", "pptx", "pdf", "md", "txt", "csv", "html"],
                    "description": "[convert] 目标格式"
                },
                "output_path": {
                    "type": "string",
                    "description": "[convert] 输出文件路径（可选，默认自动生成）"
                }
            },
            "required": ["action", "path"]
        })
    }
    async fn execute(&self, params: Value) -> HandlerResult {
        let action = params["action"].as_str().unwrap_or("");
        match action {
            "read" => execute_read(&self.doc_service, "pptx", params).await,
            "convert" => execute_convert(&self.doc_service, "pptx", params).await,
            "analyze" => execute_analyze(&self.doc_service, "pptx", params).await,
            _ => HandlerResult {
                success: false,
                output: None,
                error: Some(format!("PptxHandler 不支持的操作类型: {}", action)),
                duration_ms: 0,
            },
        }
    }
}

// ============================================================================
// PdfHandler - PDF 文档处理器
// ============================================================================

/// PDF 文档处理器
/// 聚合 read/convert/analyze 三种操作
struct PdfHandler {
    doc_service: Arc<DocumentService>,
}

impl PdfHandler {
    fn new(doc_service: Arc<DocumentService>) -> Self {
        Self { doc_service }
    }
}

#[async_trait]
impl Handler for PdfHandler {
    fn handler_name(&self) -> &str { "pdf_handler" }
    fn description(&self) -> &str {
        "PDF文档(.pdf)处理器，支持读取、格式转换、分析三种操作。转换支持pdf/txt/md/html等格式。"
    }
    fn category(&self) -> &str { "document" }
    fn is_builtin(&self) -> bool { true }
    fn supported_types(&self) -> Vec<String> {
        vec!["pdf".into()]
    }
    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["read", "convert", "analyze"],
                    "description": "操作类型: read=读取文档, convert=格式转换, analyze=分析文档"
                },
                "path": {
                    "type": "string",
                    "description": "文件路径（相对于工作区）"
                },
                "target_format": {
                    "type": "string",
                    "enum": ["txt", "md", "html"],
                    "description": "[convert] 目标格式"
                },
                "output_path": {
                    "type": "string",
                    "description": "[convert] 输出文件路径（可选，默认自动生成）"
                }
            },
            "required": ["action", "path"]
        })
    }
    async fn execute(&self, params: Value) -> HandlerResult {
        let action = params["action"].as_str().unwrap_or("");
        match action {
            "read" => execute_read(&self.doc_service, "pdf", params).await,
            "convert" => execute_convert(&self.doc_service, "pdf", params).await,
            "analyze" => execute_analyze(&self.doc_service, "pdf", params).await,
            _ => HandlerResult {
                success: false,
                output: None,
                error: Some(format!("PdfHandler 不支持的操作类型: {}", action)),
                duration_ms: 0,
            },
        }
    }
}

// ============================================================================
// CodeInterpreterHandler - 代码解释器处理器
// ============================================================================

/// 代码解释器处理器
/// 让 Agent 自由编写 Python 代码生成/修改文档
/// 承担原有 generate 和 modify 操作的全部职责
struct CodeInterpreterHandler {
    doc_service: Arc<DocumentService>,
}

impl CodeInterpreterHandler {
    fn new(doc_service: Arc<DocumentService>) -> Self {
        Self { doc_service }
    }
}

#[async_trait]
impl Handler for CodeInterpreterHandler {
    fn handler_name(&self) -> &str { "code_interpreter_handler" }
    fn description(&self) -> &str {
        "代码解释器，通过编写和执行 Python 代码生成和修改文档。所有文档生成和修改操作都通过此处理器完成。可用库: python-docx, openpyxl, python-pptx, reportlab, matplotlib, pandas, numpy, Pillow。可用 helper: create_word_doc(), save_word_doc() 等。"
    }
    fn category(&self) -> &str { "document" }
    fn is_builtin(&self) -> bool { true }
    fn supported_types(&self) -> Vec<String> {
        vec!["docx".into(), "xlsx".into(), "pptx".into(), "pdf".into()]
    }
    fn parameters(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "要执行的 Python 代码。可用库: python-docx, openpyxl, python-pptx, reportlab, matplotlib, pandas, numpy, Pillow。可用 helper: create_word_doc(), save_word_doc(), create_excel_doc(), save_excel_doc(), create_ppt_doc(), save_ppt_doc(), create_pdf_doc(), save_pdf_doc(), create_chart(), save_chart()。工作目录变量: working_dir"
                },
                "patches": {
                    "type": "array",
                    "description": "搜索替换块列表。提供此字段时，将基于上一次执行的代码应用这些替换得到完整代码，用于在原代码基础上做局部修正而非重写。每个 search 必须在原代码中唯一匹配。与 code 字段二选一，patches 优先。",
                    "items": {
                        "type": "object",
                        "properties": {
                            "search": {
                                "type": "string",
                                "description": "原代码中需要被替换的片段（必须唯一匹配，建议包含足够上下文）"
                            },
                            "replace": {
                                "type": "string",
                                "description": "替换后的片段"
                            }
                        },
                        "required": ["search", "replace"]
                    }
                },
                "description": {
                    "type": "string",
                    "description": "代码功能的简要描述，用于用户确认时展示"
                },
                "timeout": {
                    "type": "integer",
                    "description": "执行超时时间（秒），默认 60，最大 120",
                    "default": 60
                },
                "expected_files": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "预期生成的文件名列表（如 [\"报告.docx\", \"chart.png\"]）"
                }
            },
            "required": ["description"]
        })
    }
    async fn execute(&self, params: Value) -> HandlerResult {
        let start = Instant::now();
        let description = params["description"].as_str().unwrap_or("");
        let timeout = params["timeout"].as_u64().unwrap_or(60).min(120);
        let workspace_root = params["workspace_root"].as_str().unwrap_or("");

        // 判断模式：patches 优先于 code
        // patch 模式：基于 base_code（由 executor 注入上一次代码）应用搜索替换块
        // 完整代码模式：直接使用 code 字段（向后兼容）
        let final_code = if let Some(patches) = params.get("patches").and_then(|p| p.as_array()) {
            if patches.is_empty() {
                return HandlerResult {
                    success: false,
                    output: None,
                    error: Some("patches 数组不能为空".to_string()),
                    duration_ms: start.elapsed().as_millis() as u64,
                };
            }
            // patch 模式：从 base_code 获取基准（由 executor 注入）
            let base_code = params["base_code"].as_str().unwrap_or("");
            if base_code.is_empty() {
                return HandlerResult {
                    success: false,
                    output: None,
                    error: Some("使用 patch 模式但没有可用的 base_code（上一次代码不存在或为空）".to_string()),
                    duration_ms: start.elapsed().as_millis() as u64,
                };
            }
            // 应用所有搜索替换块
            match apply_patches(base_code, patches) {
                Ok(merged) => merged,
                Err(e) => return HandlerResult {
                    success: false,
                    output: None,
                    error: Some(e),
                    duration_ms: start.elapsed().as_millis() as u64,
                },
            }
        } else {
            // 完整代码模式（向后兼容）
            let code = params["code"].as_str().unwrap_or("").to_string();
            if code.is_empty() {
                return HandlerResult {
                    success: false,
                    output: None,
                    error: Some("缺少代码内容".to_string()),
                    duration_ms: start.elapsed().as_millis() as u64,
                };
            }
            code
        };

        // 调用 Sidecar：action="execute", type="code"
        // Sidecar handle_request() 通过 getattr(handler, action) 路由
        // CodeHandler 实现了 execute() 方法
        let sidecar_params = json!({
            "code": final_code,
            "working_dir": workspace_root,
            "timeout": timeout,
        });

        match self.doc_service.process("execute", "code", sidecar_params).await {
            Ok(data) => {
                let mut output = data;
                output["description"] = json!(description);
                // 在 output 中附带最终执行的代码，供 executor 保存为 last_code
                output["_executed_code"] = json!(final_code);
                HandlerResult {
                    success: true,
                    output: Some(output),
                    error: None,
                    duration_ms: start.elapsed().as_millis() as u64,
                }
            }
            Err(e) => HandlerResult {
                success: false,
                // 关键：失败时也返回完整代码，供 executor 保存为 last_code 和构造错误反馈
                output: Some(json!({ "_executed_code": final_code })),
                error: Some(e.message),
                duration_ms: start.elapsed().as_millis() as u64,
            },
        }
    }
}

/// 应用搜索替换块到基准代码上
/// 返回 Ok(merged_code) 或 Err(error_message)
/// 每个 patch 的 search 必须在 base_code 中唯一匹配，否则返回错误
fn apply_patches(base_code: &str, patches: &[serde_json::Value]) -> Result<String, String> {
    let mut result = base_code.to_string();
    for (i, patch) in patches.iter().enumerate() {
        let search = patch["search"].as_str().unwrap_or("");
        let replace = patch["replace"].as_str().unwrap_or("");
        if search.is_empty() {
            return Err(format!("第 {} 个 patch 的 search 字段不能为空", i + 1));
        }
        // 统计匹配次数，要求唯一匹配
        let match_count = result.matches(search).count();
        match match_count {
            0 => return Err(format!(
                "第 {} 个 patch 的 search 片段在原代码中未找到匹配。请确认 search 片段与原代码完全一致（包括空格、缩进、换行）。\n未匹配的 search 片段:\n{}",
                i + 1, search
            )),
            1 => {
                result = result.replacen(search, replace, 1);
            }
            _ => return Err(format!(
                "第 {} 个 patch 的 search 片段在原代码中匹配了 {} 次，要求唯一匹配。请在 search 中包含更多上下文以精确定位。",
                i + 1, match_count
            )),
        }
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 辅助函数：构造 search/replace patch 的 JSON Value
    fn make_patch(search: &str, replace: &str) -> Value {
        json!({ "search": search, "replace": replace })
    }

    /// 测试单个 patch 成功应用：修正拼写错误
    #[test]
    fn test_apply_patches_single_patch_success() {
        let base = "doc.add_paragrah('标题')\nprint('done')";
        let patches = vec![make_patch("add_paragrah", "add_paragraph")];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "doc.add_paragraph('标题')\nprint('done')");
    }

    /// 测试多个 patch 顺序应用：修正两处错误
    #[test]
    fn test_apply_patches_multiple_patches_success() {
        let base = "doc.add_paragrah('标题')\ndoc.savee('file.docx')";
        let patches = vec![
            make_patch("add_paragrah", "add_paragraph"),
            make_patch("savee", "save"),
        ];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "doc.add_paragraph('标题')\ndoc.save('file.docx')");
    }

    /// 测试 search 未匹配：返回明确错误，包含未匹配的 search 片段
    #[test]
    fn test_apply_patches_search_not_found() {
        let base = "print('hello')";
        let patches = vec![make_patch("nonexistent_code", "replacement")];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("第 1 个 patch"));
        assert!(err.contains("未找到匹配"));
        assert!(err.contains("nonexistent_code"));
    }

    /// 测试 search 多次匹配：返回明确错误，提示要求唯一匹配
    #[test]
    fn test_apply_patches_search_multiple_matches() {
        let base = "x = 1\nx = 2\nx = 3";
        // "x = " 在原代码中匹配 3 次
        let patches = vec![make_patch("x = ", "y = ")];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("第 1 个 patch"));
        assert!(err.contains("匹配了 3 次"));
        assert!(err.contains("唯一匹配"));
    }

    /// 测试空 patches 数组：apply_patches 本身允许空数组（返回原代码）
    /// 注：Handler execute() 层会拦截空 patches，apply_patches 层只负责算法
    #[test]
    fn test_apply_patches_empty_patches_returns_base() {
        let base = "original code";
        let patches: Vec<Value> = vec![];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "original code");
    }

    /// 测试空 search 字段：返回明确错误
    #[test]
    fn test_apply_patches_empty_search_field() {
        let base = "some code";
        let patches = vec![make_patch("", "replacement")];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("第 1 个 patch"));
        assert!(err.contains("search 字段不能为空"));
    }

    /// 测试 search 字段缺失（非字符串）：等同于空字符串处理
    #[test]
    fn test_apply_patches_missing_search_field() {
        let base = "some code";
        // search 字段缺失，unwrap_or("") 返回空字符串
        let patches = vec![json!({ "replace": "replacement" })];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("search 字段不能为空"));
    }

    /// 测试空白字符敏感：search 必须与原代码完全一致（tab 与 space 不互通）
    #[test]
    fn test_apply_patches_whitespace_sensitive() {
        // base 使用 4 个空格缩进，search 使用 tab 缩进 -> 应匹配失败
        let base = "    doc.add_paragraph('标题')\n";
        let patches = vec![make_patch("\tdoc.add_paragraph", "doc.add_heading")];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("未找到匹配"));

        // 缩进完全一致（4 个空格），应匹配成功
        let patches2 = vec![make_patch("    doc.add_paragraph", "    doc.add_heading")];
        let result2 = apply_patches(base, &patches2);
        assert!(result2.is_ok());
        assert_eq!(result2.unwrap(), "    doc.add_heading('标题')\n");
    }

    /// 测试多行 search/replace：支持跨行片段替换
    #[test]
    fn test_apply_patches_multiline_search_replace() {
        let base = "for i in range(10):\n    print(i)\n";
        let search = "for i in range(10):\n    print(i)";
        let replace = "for j in range(5):\n    print(j * 2)";
        let patches = vec![make_patch(search, replace)];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "for j in range(5):\n    print(j * 2)\n");
    }

    /// 测试 replace 为空字符串：等同于删除 search 片段
    #[test]
    fn test_apply_patches_empty_replace_deletes_search() {
        let base = "line1\nunnecessary_line\nline3";
        let patches = vec![make_patch("unnecessary_line\n", "")];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "line1\nline3");
    }

    /// 测试多个 patch 时第一个失败：应立即返回错误，不应用后续 patch
    #[test]
    fn test_apply_patches_first_patch_fails_stops_early() {
        let base = "original";
        let patches = vec![
            make_patch("nonexistent", "replacement1"),
            make_patch("original", "replacement2"),  // 这个本应匹配，但因第一个失败不会执行
        ];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("第 1 个 patch"));
        // 原代码未被修改
    }

    /// 测试多个 patch 时第二个失败：第一个已应用，第二个返回错误
    #[test]
    fn test_apply_patches_second_patch_fails() {
        let base = "foo\nbar";
        let patches = vec![
            make_patch("foo", "FOO"),  // 第一个成功
            make_patch("nonexistent", "BAZ"),  // 第二个失败
        ];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("第 2 个 patch"));
        assert!(err.contains("未找到匹配"));
    }

    /// 测试 patch 顺序应用：第一个 patch 的 replace 结果会影响第二个 patch 的 search 匹配
    #[test]
    fn test_apply_patches_sequential_application() {
        let base = "a = 1";
        let patches = vec![
            make_patch("a = 1", "b = 2"),
            make_patch("b = 2", "c = 3"),  // 在第一个 patch 应用后的结果中匹配
        ];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "c = 3");
    }

    /// 测试中文字符在 search/replace 中的正确处理
    #[test]
    fn test_apply_patches_chinese_characters() {
        let base = "标题 = '测试内容'\nprint(标题)";
        let patches = vec![make_patch("测试内容", "修正后的内容")];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "标题 = '修正后的内容'\nprint(标题)");
    }

    /// 测试空 base_code：任何非空 search 都无法匹配
    #[test]
    fn test_apply_patches_empty_base_code() {
        let base = "";
        let patches = vec![make_patch("something", "replacement")];
        let result = apply_patches(base, &patches);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("未找到匹配"));
    }

    /// 测试空 base_code 加空 patches：返回空字符串
    #[test]
    fn test_apply_patches_empty_base_empty_patches() {
        let base = "";
        let patches: Vec<Value> = vec![];
        let result = apply_patches(base, &patches);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "");
    }
}
