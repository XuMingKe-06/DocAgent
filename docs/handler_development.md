# DocAgent Handler & Tool 系统开发规范

> 版本: 0.1.6
> 适用项目: DocAgent AI 文档处理桌面应用
> 最后更新: 2026-06-14

---

## 目录

1. [概述](#1-概述)
2. [Handler 接口规范](#2-handler-接口规范)
3. [内置 Handler 详细实现规范](#3-内置-handler-详细实现规范)
4. [Tool 系统](#4-tool-系统)
5. [Code Interpreter 架构](#5-code-interpreter-架构)
6. [Handler 与 LLM 的 Tool Calling 交互协议](#6-handler-与-llm-的-tool-calling-交互协议)
7. [附录](#7-附录)

---

## 1. 概述

DocAgent 包含两套平行的可调用单元：

| 系统 | 数量 | 实现语言 | 实现方式 | 用途 |
|------|------|---------|---------|------|
| Handler | 5 个 | Python | Sidecar 进程 | 文档读取/转换/分析（read/convert/analyze） |
| Tool | 8 个 | Rust | 原生实现 | 文件系统操作（列表/搜索/读写/删除/信息/存在检查/创建目录） |
| Code Interpreter | 1 个 | Python | Sidecar 进程 | 执行任意 Python 代码，用于文档生成和修改 |

**架构总览**：

```
                    LLM (Tool Calling)
                           │
              ┌────────────┼────────────┐
              │            │            │
         Handler       Code         Tool
        Registry    Interpreter    Registry
              │            │            │
              ▼            ▼            ▼
        Python Sidecar  Python      Rust 原生
        (read/convert/  (execute    (list/search/read/
         analyze)        code)      write/delete/...)
```

### 关键设计决策

- **文档生成/修改**：通过 Code Interpreter 编写 Python 代码实现（使用 python-docx/openpyxl/python-pptx/reportlab 等库）
- **文档读取/转换/分析**：通过 Handler 直接调用 Sidecar 的对应 action
- **文件系统操作**：通过 Rust 原生 Tool 实现，不依赖 Python
- Handler 和 Tool 均**始终启用**，不可由用户禁用

---

## 2. Handler 接口规范

### 2.1 Rust Trait 定义

```rust
#[async_trait]
pub trait Handler: Send + Sync {
    fn handler_name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters(&self) -> Value;
    async fn execute(&self, params: Value) -> HandlerResult;
}
```

其中 Handler 的 `execute` 方法通过 `SidecarManager` 向 Python 进程发送请求并接收响应。

### 2.2 HandlerResult

```rust
pub struct HandlerResult {
    pub success: bool,
    pub data: Option<Value>,
    pub error: Option<String>,
}
```

### 2.3 HandlerRegistry

```rust
pub struct HandlerRegistry {
    handlers: HashMap<String, Arc<dyn Handler>>,
}
```

注册表在初始化时注册 5 个内置 Handler，每个 Handler 对应一个文档类型（docx/xlsx/pptx/pdf/md）。

---

## 3. 内置 Handler 详细实现规范

5 个文档类型 Handler，每个 Handler 支持 3 种 action：

| Action | 说明 | 风险等级 | 需确认 |
|--------|------|----------|--------|
| `read` | 读取文档内容（文本+元数据） | 低 | 否 |
| `convert` | 格式转换 | 低 | 否 |
| `analyze` | 文档分析（统计+结构） | 低 | 否 |

### 3.1 docx_handler

用于 Word 文档的处理。

**参数**：
- `action` (string, required): read / convert / analyze
- `input_path` (string, required): 文档文件路径
- `params` (object, optional): 附加参数（如 convert 时的 target_format）

**示例调用**：
```json
{
  "action": "read",
  "input_path": "/workspace/doc.docx",
  "params": {}
}
```

### 3.2 xlsx_handler

用于 Excel 文档的处理。

### 3.3 pptx_handler

用于 PPT 文档的处理。

### 3.4 pdf_handler

用于 PDF 文档的处理（基于 PyMuPDF/fitz）。

### 3.5 code_interpreter_handler

文档生成和修改的核心 Handler，通过执行 Python 代码实现复杂文档操作。

详见第 5 节。

---

## 4. Tool 系统

### 4.1 Rust Trait 定义

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn tool_name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters(&self) -> Value;
    async fn execute(&self, params: Value, workspace_root: &Path) -> ToolResult;
}
```

与 Handler 不同的是，Tool 的 `execute` 方法接收 `workspace_root` 参数（由 executor 注入），用于路径安全校验。

### 4.2 内置 Tool 列表

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `list_directory` | 列出目录内容 | path, max_depth?, extensions?, sort_by? |
| `search_files` | 搜索文件 | query, path?, extensions?, max_results?, include_content? |
| `read_file` | 读取纯文本文件 | path, encoding? |
| `write_text_file` | 写入文本文件 | path, content, append? |
| `delete_file` | 删除文件 | path, create_backup? |
| `file_info` | 获取文件元数据 | path |
| `file_exists` | 检查文件/目录是否存在 | path |
| `create_directory` | 创建目录 | path, recursive? |

### 4.3 路径安全机制

所有 Tool 通过 executor 注入的 `workspace_root` 进行路径校验：

```rust
fn resolve_path(workspace_root: &Path, input_path: &str) -> Result<PathBuf, ToolError> {
    let resolved = workspace_root.join(input_path).canonicalize()?;
    if !resolved.starts_with(workspace_root) {
        return Err(ToolError::PathOutOfBounds);
    }
    Ok(resolved)
}
```

拒绝路径遍历攻击（如 `../../etc/passwd`）。

---

## 5. Code Interpreter 架构

### 5.1 架构设计

Code Interpreter 通过 Python Sidecar 的 `execute` action 运行用户/LLM 生成的 Python 代码，替代了传统 Handler 的 generate/modify 操作。

```
LLM 生成代码 → Code Interceptor Handler
  → Sidecar `action="execute"` 
  → code_executor.py（安全沙箱）
  → 代码执行 → 文件写入工作区
```

### 5.2 安全机制

| 安全层 | 实现方式 |
|--------|---------|
| 模块黑名单 | `safe_import` 拦截 socket/subprocess/os.system 等 |
| 正则模式匹配 | 拦截 `os.system(`, `__import__(`, `eval(`, `exec(` 等 |
| 文件路径隔离 | `safe_open` 只允许写入工作区目录 |
| 子进程隔离 | 代码在独立子进程中执行，崩溃不影响主进程 |
| 执行超时 | 默认 60 秒超时 |
| 内存限制 | 512MB 内存上限 |
| 输出限制 | stdout 截断至 10000 字节 |

### 5.3 Helper 函数

Code Interpreter 提供预设的 helper 函数供 LLM 生成的代码调用：

| 函数 | 功能 |
|------|------|
| `create_word_doc()` | 创建 Word 文档（含配色方案） |
| `save_word_doc(doc, path)` | 保存 Word 文档 |
| `create_chart(type, data, title)` | 生成图表（bar/line/pie/scatter/area/hist） |
| `create_excel_doc()` | 创建 Excel 工作簿 |
| `save_excel_doc(wb, path)` | 保存 Excel 工作簿 |
| `create_ppt_doc(theme)` | 创建 PPT（ocean/midnight/forest/coral/charcoal） |
| `save_ppt_doc(prs, path)` | 保存 PPT |
| `create_pdf_doc()` | 创建 PDF 配置 |
| `save_pdf_doc(config, path)` | 保存 PDF |

### 5.4 确认机制

Code Interpreter 执行前需要用户确认（风险等级高）：
- 确认弹窗显示代码功能描述
- 显示代码摘要（前 200 字符）
- 用户确认后执行，拒绝后 LLM 调整策略

---

## 6. Handler 与 LLM 的 Tool Calling 交互协议

### 6.1 交互流程

```
1. LLM 分析用户意图
2. LLM 返回 tool_calls（Handler/Tool/Code Interpreter）
3. AgentExecutor 解析 tool_calls
4. 高风险操作触发用户确认
5. 执行 Handler/Tool/Code Interpreter
6. 结果返回给 LLM
7. 循环直到 LLM 返回纯文本
```

### 6.2 循环控制

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 最大迭代次数 | 20 | 达到后返回错误 |
| 确认超时 | 5 分钟 | 超时后自动取消 |
| Sidecar 超时 | 120 秒（代码执行）/ 60 秒（文档操作） |

### 6.3 确认机制的集成

- 操作前通过 `confirm_channels` oneshot channel 同步等待用户确认
- 前端 `ConfirmNode` 组件展示确认弹窗
- 用户确认/拒绝后通过 `confirm_operation` 命令返回结果
- 超时后返回 `AGENT_CONFIRMATION_TIMEOUT` 错误

---

## 7. 附录

### 7.1 Handler/Tool 速查表

| 名称 | 类型 | 语言 | 说明 |
|------|------|------|------|
| docx_handler | Handler | Python | Word 文档 read/convert/analyze |
| xlsx_handler | Handler | Python | Excel 文档 read/convert/analyze |
| pptx_handler | Handler | Python | PPT 文档 read/convert/analyze |
| pdf_handler | Handler | Python | PDF 文档 read/convert/analyze |
| code_interpreter_handler | Handler | Python | 执行 Python 代码 |
| list_directory | Tool | Rust | 列出目录内容 |
| search_files | Tool | Rust | 搜索文件 |
| read_file | Tool | Rust | 读取文本文件 |
| write_text_file | Tool | Rust | 写入文本文件 |
| delete_file | Tool | Rust | 删除文件 |
| file_info | Tool | Rust | 获取文件元数据 |
| file_exists | Tool | Rust | 检查文件存在 |
| create_directory | Tool | Rust | 创建目录 |

### 7.2 Sidecar 协议

请求格式：
```json
{"id": "uuid", "action": "read|convert|analyze|execute|ping|validate", "type": "docx|xlsx|pptx|pdf|md|code|txt", "params": {}}
```

响应格式：
```json
{"id": "uuid", "success": true|false, "data": {}, "error": null}
```
