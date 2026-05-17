# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

DocAgent 是一款 AI 文档处理桌面应用，通过自然语言驱动 Agent 完成 Word、Excel、PDF、PPT、Markdown 等文档的生成、修改、格式转换等操作。技术栈：Tauri 2 + React 19 + TypeScript 5 + Zustand 5 + Tailwind CSS 4。

## 开发阶段（Phase 1 MVP 早期）

当前各模块完成度：

| 模块 | 状态 | 说明 |
|------|------|------|
| 前端 UI 组件 | 基本完成 | 约 2400 行，所有组件、Store、类型已搭建 |
| Rust 后端 | 空桩阶段 | 仅 50 行，commands/services/db/config/utils 全是 TODO 注释 |
| Python Sidecar | 骨架阶段 | main.py 仅有请求接收框架，无实际文档处理逻辑 |
| 前后端共享类型 | 初始定义 | 仅定义了 NodeType 和 ExecutionStatus |

### 下一步开发重点
- Rust 后端命令实现（llm、workspace、document、session、skill 等）
- SQLite 数据库层（建表、CRUD）
- LLM 适配器（Provider trait、OpenAI/Claude/Gemini）
- Agent 调度引擎（Tool Calling 循环）
- Skill 执行引擎（注册表、执行器、内置 Skills）
- Python Sidecar 文档处理（python-docx、openpyxl 等）

## 常用命令

```bash
# 启动 Vite 开发服务器（端口 1420）
npm run dev

# TypeScript 检查 + Vite 构建
npm run build

# 启动 Tauri 桌面应用开发模式
npm run tauri:dev

# Tauri 生产构建
npm run tauri:build
```

## 目录结构

```
src/                      # React 前端（约 2400 行，基本完成）
├── components/
│   ├── layout/           # TopBar, MainLayout, MainArea, Sidebar, InputArea
│   ├── workflow/         # WorkflowTimeline + 6 种节点组件
│   ├── sidebar/          # FileTreeSection, AgentInfoSection, TodoSection, TokenSection
│   ├── preview/          # PreviewOverlay 预览面板
│   ├── settings/         # SettingsDialog + 5 个标签页
│   ├── session/          # HistoryPanel
│   └── common/           # Button, Icon
├── stores/               # 6 个 Zustand Store
├── types/                # 类型定义
├── utils/                # fileIcons, format
└── styles/globals.css    # Tailwind + 自定义设计令牌

src-tauri/                # Tauri Rust 后端（仅 50 行桩代码）
├── src/
│   ├── commands/mod.rs   # TODO: 7 个命令模块待实现
│   ├── services/mod.rs   # TODO: 5 个服务模块待实现
│   ├── db/mod.rs         # TODO: 5 个数据库模块待实现
│   ├── config/mod.rs     # TODO: 3 个配置模块待实现
│   └── utils/mod.rs      # TODO: 工具函数待实现
└── resources/sidecar/    # 待开发的 Python Sidecar

sidecar/                  # Python Sidecar 骨架（stdin/stdout JSON 协议通信）
shared/types.ts           # 前后端共享类型（NodeType, ExecutionStatus）
docs/                     # 设计文档（PRD、技术架构、组件设计、数据库设计）
```

## 核心架构

### 通信方式
- `invoke()` — 请求-响应式调用（同步）
- `emit()/listen()` — 事件推送（流式输出、进度更新）
- **事件命名**：`namespace:action` 格式（如 `agent:thinking`, `session:updated`）

### Agent 执行流程（待后端实现）
前端已预留完整的流式事件处理协议：
1. `agent:thinking` — LLM 思考链增量
2. `agent:content` — LLM 回复增量
3. `agent:tool_call` — Tool 调用开始
4. `agent:tool_result` — Tool 执行结果
5. `agent:confirm` — 需要用户确认
6. `agent:todo_update` — Todo 列表更新
7. `agent:done` — 执行完成
8. `agent:error` / `agent:stopped` — 错误/中断

### 状态管理
6 个 Zustand Store 职责分离：Workflow（节点）、Session（会话）、Workspace（工作区）、Settings（设置+LLM+Skill+模板）、FileTree（文件树）、Token（统计）。

### Python Sidecar
文档处理通过独立 Python 进程执行，与 Rust 后端通过 stdin/stdout JSON 协议通信。依赖：python-docx、openpyxl、python-pptx、reportlab、pdfkit。

## 开发注意事项

- **命名规范**：Tauri 命令用 `snake_case`，前端封装用 `camelCase`，事件名用 `namespace:action`
- **状态管理**：避免直接修改 store 中的数组/对象，使用不可变更新
- **组件优化**：工作流节点使用 React.memo，长列表使用虚拟滚动，搜索输入使用防抖
- **提交规范**：遵循 Conventional Commits 格式（feat/fix/docs/refactor/chore 等），使用中文描述
