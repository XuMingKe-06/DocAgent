//! 任务类型识别模块
//! 根据用户消息关键词和已调用工具推断当前任务类型，
//! 用于按需注入文档设计规范和匹配示例

/// 任务类型枚举
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TaskType {
    /// 生成 Word 文档
    GenerateDocx,
    /// 生成 Excel 文档
    GenerateXlsx,
    /// 生成 PPT 文档
    GeneratePptx,
    /// 生成 PDF 文档
    GeneratePdf,
    /// 生成 Markdown 文档
    GenerateMd,
    /// 读取文档
    ReadDocument,
    /// 修改文档
    ModifyDocument,
    /// 格式转换
    ConvertFormat,
    /// 分析文档
    AnalyzeDocument,
    /// 批量处理
    BatchProcess,
    /// 纯文件系统操作
    FileSystem,
    /// 通用问答
    General,
    /// 无法判断
    Unknown,
}

impl TaskType {
    /// 根据用户消息内容识别任务类型
    /// 基于关键词匹配策略
    pub fn from_user_message(message: &str) -> Self {
        let msg = message.to_lowercase();

        // 修改文档类关键词（优先于生成类匹配，因为"修改文档"中的"文档"不应触发生成）
        if contains_any(&msg, &["修改", "替换", "编辑", "更新", "更改", "调整"]) && contains_any(&msg, &["文档", "文件", "报告", "合同", ".docx", ".xlsx", ".pptx", ".pdf"])
        {
            return TaskType::ModifyDocument;
        }

        // 读取文档类关键词（优先于生成类匹配）
        if contains_any(&msg, &["读取", "查看", "打开", "看看", "阅读", "内容是什么", "里面有什么"])
            && contains_any(&msg, &["文档", "文件", ".docx", ".xlsx", ".pptx", ".pdf"])
        {
            return TaskType::ReadDocument;
        }

        // 格式转换类关键词（优先于生成类匹配，因为"转成"不应触发生成）
        if contains_any(&msg, &["转换", "转成", "转为", "转换成", "转格式"])
        {
            return TaskType::ConvertFormat;
        }

        // 分析文档类关键词
        if contains_any(&msg, &["分析", "统计", "结构", "字数", "段落数"])
            && contains_any(&msg, &["文档", "文件"])
        {
            return TaskType::AnalyzeDocument;
        }

        // 批量处理类关键词
        if contains_any(&msg, &["批量", "多个文件", "所有文件", "全部文件"])
        {
            return TaskType::BatchProcess;
        }

        // 文件系统操作关键词
        if contains_any(&msg, &["列出", "搜索", "查找文件", "文件列表", "目录", "创建文件夹", "删除文件", "文件是否存在"])
        {
            return TaskType::FileSystem;
        }

        // 生成文档类关键词（放在操作类之后，避免"修改文档"被误判为生成）
        if contains_any(&msg, &["生成word", "创建word", "新建word", "写一个word", "制作word", ".docx"])
            || (contains_any(&msg, &["生成", "创建", "新建", "写", "制作"]) && contains_any(&msg, &["文档", "报告", "合同", "周报", "月报", "纪要", "方案", "信函", "通知"]) && !contains_any(&msg, &["excel", "表格", "ppt", "幻灯片", "pdf"]))
        {
            return TaskType::GenerateDocx;
        }

        if contains_any(&msg, &["生成excel", "创建excel", "新建excel", "写一个excel", "制作excel", ".xlsx", "电子表格"])
            || (contains_any(&msg, &["生成", "创建", "新建", "写", "制作"]) && contains_any(&msg, &["表格", "数据表", "报表", "excel", "电子表格"]))
        {
            return TaskType::GenerateXlsx;
        }

        if contains_any(&msg, &["生成ppt", "创建ppt", "新建ppt", "写一个ppt", "制作ppt", ".pptx", "幻灯片", "演示文稿"])
            || (contains_any(&msg, &["生成", "创建", "新建", "制作"]) && contains_any(&msg, &["ppt", "幻灯片", "演示"]))
        {
            return TaskType::GeneratePptx;
        }

        if contains_any(&msg, &["生成pdf", "创建pdf", "新建pdf", ".pdf"])
            || (contains_any(&msg, &["生成", "创建", "新建"]) && contains_any(&msg, &["pdf"]))
        {
            return TaskType::GeneratePdf;
        }

        if contains_any(&msg, &["生成markdown", "创建markdown", "新建markdown", ".md", "写一个md"])
            || (contains_any(&msg, &["生成", "创建", "新建"]) && contains_any(&msg, &["markdown", "md文件"]))
        {
            return TaskType::GenerateMd;
        }

        TaskType::Unknown
    }

    /// 根据已调用的工具名称推断任务类型
    /// 用于后续迭代中修正任务类型判断
    pub fn from_tool_name(tool_name: &str) -> Self {
        match tool_name {
            "generate_document" => TaskType::Unknown, // 需要根据 format 参数进一步判断
            "read_document" => TaskType::ReadDocument,
            "modify_document" => TaskType::ModifyDocument,
            "convert_format" => TaskType::ConvertFormat,
            "analyze_document" => TaskType::AnalyzeDocument,
            "batch_process" => TaskType::BatchProcess,
            "list_directory" | "search_files" | "read_file" | "file_info"
            | "file_exists" | "delete_file" | "create_directory" | "write_text_file" => TaskType::FileSystem,
            _ => TaskType::Unknown,
        }
    }

    /// 根据 generate_document 的 format 参数确定具体的生成类型
    pub fn from_document_format(format: &str) -> Self {
        match format {
            "docx" => TaskType::GenerateDocx,
            "xlsx" => TaskType::GenerateXlsx,
            "pptx" => TaskType::GeneratePptx,
            "pdf" => TaskType::GeneratePdf,
            "md" => TaskType::GenerateMd,
            _ => TaskType::Unknown,
        }
    }

    /// 获取此任务类型需要注入的文档设计规范类型列表
    /// 返回 doc_type 字符串列表，用于 get_design_guide_by_type()
    pub fn required_guide_types(&self) -> Vec<&'static str> {
        match self {
            TaskType::GenerateDocx | TaskType::ModifyDocument => vec!["docx"],
            TaskType::GenerateXlsx => vec!["xlsx"],
            TaskType::GeneratePptx => vec!["pptx"],
            TaskType::GeneratePdf => vec!["pdf"],
            TaskType::ReadDocument | TaskType::AnalyzeDocument => vec![],
            TaskType::ConvertFormat => vec![],
            TaskType::FileSystem => vec![],
            TaskType::General => vec![],
            TaskType::GenerateMd => vec![],
            TaskType::BatchProcess => vec![],
            TaskType::Unknown => vec!["docx"], // 默认注入最常见类型
        }
    }
}

/// 检查字符串是否包含任一关键词
fn contains_any(text: &str, keywords: &[&str]) -> bool {
    keywords.iter().any(|kw| text.contains(kw))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_user_message_generate_docx() {
        assert_eq!(TaskType::from_user_message("帮我创建一份项目周报"), TaskType::GenerateDocx);
        assert_eq!(TaskType::from_user_message("生成Word文档"), TaskType::GenerateDocx);
        assert_eq!(TaskType::from_user_message("写一个合同文档"), TaskType::GenerateDocx);
    }

    #[test]
    fn test_from_user_message_generate_xlsx() {
        assert_eq!(TaskType::from_user_message("创建一个Excel数据表"), TaskType::GenerateXlsx);
        assert_eq!(TaskType::from_user_message("制作报表"), TaskType::GenerateXlsx);
        assert_eq!(TaskType::from_user_message("生成电子表格"), TaskType::GenerateXlsx);
    }

    #[test]
    fn test_from_user_message_generate_pptx() {
        assert_eq!(TaskType::from_user_message("创建PPT演示文稿"), TaskType::GeneratePptx);
        assert_eq!(TaskType::from_user_message("制作幻灯片"), TaskType::GeneratePptx);
    }

    #[test]
    fn test_from_user_message_generate_pdf() {
        assert_eq!(TaskType::from_user_message("生成PDF文件"), TaskType::GeneratePdf);
    }

    #[test]
    fn test_from_user_message_read_document() {
        assert_eq!(TaskType::from_user_message("读取data.xlsx的内容"), TaskType::ReadDocument);
        assert_eq!(TaskType::from_user_message("查看报告.docx里面有什么"), TaskType::ReadDocument);
    }

    #[test]
    fn test_from_user_message_modify_document() {
        assert_eq!(TaskType::from_user_message("修改报告.docx的内容"), TaskType::ModifyDocument);
        assert_eq!(TaskType::from_user_message("替换文档中的文字"), TaskType::ModifyDocument);
    }

    #[test]
    fn test_from_user_message_convert_format() {
        assert_eq!(TaskType::from_user_message("把方案.docx转成PDF"), TaskType::ConvertFormat);
    }

    #[test]
    fn test_from_user_message_analyze() {
        assert_eq!(TaskType::from_user_message("分析文档结构"), TaskType::AnalyzeDocument);
    }

    #[test]
    fn test_from_user_message_batch() {
        assert_eq!(TaskType::from_user_message("批量处理多个文件"), TaskType::BatchProcess);
    }

    #[test]
    fn test_from_user_message_filesystem() {
        assert_eq!(TaskType::from_user_message("列出目录内容"), TaskType::FileSystem);
        assert_eq!(TaskType::from_user_message("搜索文件"), TaskType::FileSystem);
    }

    #[test]
    fn test_from_user_message_unknown() {
        assert_eq!(TaskType::from_user_message("你好"), TaskType::Unknown);
        assert_eq!(TaskType::from_user_message("什么是DocAgent"), TaskType::Unknown);
    }

    #[test]
    fn test_from_tool_name() {
        assert_eq!(TaskType::from_tool_name("read_document"), TaskType::ReadDocument);
        assert_eq!(TaskType::from_tool_name("modify_document"), TaskType::ModifyDocument);
        assert_eq!(TaskType::from_tool_name("convert_format"), TaskType::ConvertFormat);
        assert_eq!(TaskType::from_tool_name("list_directory"), TaskType::FileSystem);
    }

    #[test]
    fn test_from_document_format() {
        assert_eq!(TaskType::from_document_format("docx"), TaskType::GenerateDocx);
        assert_eq!(TaskType::from_document_format("xlsx"), TaskType::GenerateXlsx);
        assert_eq!(TaskType::from_document_format("pptx"), TaskType::GeneratePptx);
        assert_eq!(TaskType::from_document_format("pdf"), TaskType::GeneratePdf);
        assert_eq!(TaskType::from_document_format("md"), TaskType::GenerateMd);
    }

    #[test]
    fn test_required_guide_types() {
        assert_eq!(TaskType::GenerateDocx.required_guide_types(), vec!["docx"]);
        assert_eq!(TaskType::GenerateXlsx.required_guide_types(), vec!["xlsx"]);
        assert_eq!(TaskType::ReadDocument.required_guide_types(), Vec::<&str>::new());
        assert_eq!(TaskType::Unknown.required_guide_types(), vec!["docx"]);
    }

    #[test]
    fn test_multi_type_message() {
        // 包含 Word 和 Excel 关键词的消息，Excel 关键词优先匹配
        assert_eq!(TaskType::from_user_message("创建一个Word报告和配套的Excel数据表"), TaskType::GenerateXlsx);
    }
}
