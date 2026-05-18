# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

DocAgent 是一个基于 Tauri 2.x 的 AI 文档处理桌面应用。用户通过对话式 AI Agent 完成 Word/Excel/PPT/PDF/Markdown 文档的生成、读取、修改、格式转换等操作。

## 当前开发阶段

项目处于 **Phase 2 - 格式扩展（Sprint 6-7）**，已完成 Phase 1 (MVP) 全部核心功能开发，正在完善多格式文档处理和预览能力。

### 已完成（Phase 1 - MVP）
| Sprint | 内容 | 状态 |
|--------|------|------|
| Sprint 1 | Tauri 2 + React + TypeScript 项目搭建、SQLite 初始化、JSON 配置管理 | 完成 |
| Sprint 2 | LLM Provider trait + OpenAI 适配器（含流式）、Agent 执行引擎（Tool Calling 循环）、Tauri 事件系统、前端 useAgent Hook | 完成 |
| Sprint 3 | Skill 接口与注册表、Python Sidecar 管理器、Word 文档生成/读取/修改 Skill | 完成 |
| Sprint 4 | 主界面布局、工作流时间线组件、输入框组件、右侧栏（Agent 信息/Todo/Token 统计） | 完成 |
| Sprint 5 | 会话管理（CRUD + 持久化）、版本快照服务、历史会话面板、操作确认机制 | 完成 |

### 正在进行（Phase 2 - 格式扩展）
| Sprint | 内容 | 状态 |
|--------|------|------|
| Sprint 6 | Excel/PPT/PDF/Markdown 文档处理器（Sidecar handler 已完成）、多 LLM Provider 适配 | 进行中 |
| Sprint 7 | 格式转换（convert_format）、文档预览浮层、差异对比预览、工作区文件树 | 待开始 |

## 技术栈

- **桌面框架**: Tauri 2.x (Rust + React/TypeScript)
- **前端**: React 19 + TypeScript 5 + Vite 6 + Tailwind CSS 4
- **状态管理**: Zustand 5
- **后端语言**: Rust 1.80+ (edition 2021)
- **数据库**: SQLite (rusqlite, bundled)
- **配置存储**: JSON 文件 (serde)
- **文档处理**: Python 3.12+ Sidecar (python-docx / openpyxl / python-pptx / PyMuPDF / reportlab)

## 构建与运行命令

```bash
# 开发模式（前端热更新 + Tauri 桌面窗口）
npm run tauri:dev

# 仅启动前端开发服务器（浏览器访问 localhost:1420）
npm run dev

# 生产构建
npm run tauri:build

# TypeScript 类型检查
npm run build    # 实际执行 tsc -b && vite build

# 其他
npm run preview  # 预览生产构建
```

Python Sidecar 依赖安装:
```bash
pip install -r sidecar/requirements.txt
```

环境变量 `DOCAGENT_PYTHON` 可指定 Python 解释器路径。

## 项目架构

```
┌─ src/                  React 前端 (TypeScript)
│  ├─ components/
│  │  ├─ layout/         布局组件: TopBar, MainArea, Sidebar, InputArea
│  │  ├─ workflow/       工作流时间线组件: WorkflowTimeline, WorkflowNode(多种子类型)
│  │  ├─ sidebar/        右侧栏: FileTreeSection, AgentInfoSection, TodoSection, TokenSection
│  │  ├─ preview/        文档预览浮层
│  │  ├─ settings/       设置弹窗: LLM配置, 工作区管理, Skills管理, 模板管理
│  │  ├─ session/        会话历史面板
│  │  └─ common/         通用组件: Button, Icon
│  ├─ stores/            Zustand stores (6个): workflow, session, settings, workspace, fileTree, token
│  ├─ services/          前端服务层: tauri.ts(invoke封装), event.ts(事件监听)
│  ├─ hooks/             useAgent.ts (Agent交互核心hook)
│  └─ types/             TypeScript类型定义 (与Rust后端对齐)
│
├─ src-tauri/            Rust 后端
│  ├─ src/
│  │  ├─ main.rs / lib.rs   入口, AppState定义, 命令注册
│  │  ├─ commands/           Tauri命令层 (7个模块): llm, session, workspace, document, skill, settings, agent
│  │  ├─ services/          业务逻辑层
│  │  │  ├─ agent/          Agent调度引擎: executor (Tool Calling循环), context (对话上下文管理)
│  │  │  ├─ llm/            LLM多 Provider 适配: router (路由与fallback), provider (trait), openai_adapter
│  │  │  ├─ skill/          Skill引擎: registry (注册表+禁用管理), builtin (内置技能)
│  │  │  └─ document/       Python Sidecar进程管理
│  │  ├─ db/                数据库层: init (SQLite初始化+迁移), session/message/snapshot/token repo
│  │  ├─ config/            配置管理: app_settings, llm_config, workspace_config
│  │  ├─ models/            数据模型: message, session, document, llm, skill, workspace
│  │  ├─ events/            事件系统: types (事件payload), emitter (事件发射)
│  │  └─ errors.rs          统一错误码与 CommandError
│  └─ Cargo.toml
│
├─ sidecar/              Python 文档处理引擎
│  ├─ main.py            stdin/stdout JSON 协议入口
│  └─ handlers/          文档处理器: word_handler, excel_handler, ppt_handler, pdf_handler, markdown_handler
│
├─ shared/               前后端共享类型 (TypeScript, 需与Rust端手动同步)
└─ docs/                 开发文档
```

## 核心架构要点

### 前后端通信
- **`invoke()`**: 请求-响应式调用（查询数据、操作触发），命令名 `snake_case`
- **`emit()/listen()`**: 事件推送（Agent流式输出、进度更新、需确认操作等），事件名 `namespace:action`
- Agent 事件列表: `agent:thinking`, `agent:content`, `agent:tool_call`, `agent:tool_result`, `agent:confirm`, `agent:todo_update`, `agent:done`, `agent:error`, `agent:stopped`

### Agent 执行流程
1. 前端 `useAgent` hook 调用 `start_agent` 命令
2. Rust `AgentExecutor` 构建上下文（System Prompt + Skill Tool Definitions + 历史消息）
3. 循环: 调用 LLM (流式) → 解析响应 → 执行 Tool Calling (Skill) → 返回结果给 LLM
4. 高风险操作（删除/修改/批量）需用户确认，通过 `confirm_channels` oneshot channel 同步等待
5. 每轮迭代后增量持久化消息到 SQLite
6. Skill 执行时短暂持锁获取 Arc 引用后立即释放，避免阻塞注册表

### Skill 系统
- 每个 Skill 实现 `Skill` trait (async_trait): `skill_name()`, `description()`, `parameters()` (JSON Schema), `execute()`
- 内置 Skill 在 `services/skill/builtin.rs` 中注册，包括文档生成/读取/修改/删除/转换/搜索/分析/批量处理
- 自定义 Skill 可通过配置添加，执行时转发到 Python Sidecar
- 注册表管理启用/禁用状态，`tool_definitions()` 只返回已启用的技能

### Python Sidecar 通信协议
- stdin/stdout JSON 行协议
- 请求: `{"id": "...", "action": "generate|read|modify|delete|convert|analyze", "type": "docx|xlsx|pptx|pdf|md", "params": {...}}`
- 响应: `{"id": "...", "success": true|false, "data": {...}, "error": "..."}`
- `input_path` 参数自动映射为 `path` 传入 handler

### 状态管理 (前端)
- `useWorkflowStore`: 工作流节点列表、执行状态、确认回调
- `useSessionStore`: 会话 CRUD 和当前会话
- `useWorkspaceStore`: 工作区列表、当前工作区、切换逻辑
- `useSettingsStore`: 应用设置（弹窗开关等）
- `useFileTreeStore`: 文件树数据与加载状态
- `useTokenStore`: Token 用量统计与事件监听

### 数据存储
- SQLite: 会话、消息、版本快照、Token 统计
- JSON 文件: LLM Provider 配置、应用设置、工作区配置
- 文件系统: 工作区文档和 Sidecar 日志 (`log/sidecar.log`)
- 应用数据目录: `<app_data_dir>/docagent.db` + 配置

## 提交规范

使用 Conventional Commits 格式，类型: feat/fix/docs/style/refactor/perf/test/chore，范围可选，使用中文描述。

## 关键约束

- 前端与 Rust 后端类型需手动同步（`shared/types.ts` 中的 `NodeType`、`ExecutionStatus` 等）
- Tauri 命令名 `snake_case`，前端封装函数名 `camelCase`
- Rust 事件 payload 使用 `#[serde(rename_all = "camelCase")]`，前端直接接收 camelCase 字段
- Python Sidecar 的 `input_path` 要映射为 handler 期望的 `path` 参数
