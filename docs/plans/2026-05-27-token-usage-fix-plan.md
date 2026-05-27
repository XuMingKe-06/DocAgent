# Token 用量统计功能全面修复计划

## 问题根因分析

设置页面中的token用量数据始终显示为0，今日用量和本月用量未实现数据追加统计，并且未实现持久化，经过对前后端代码的全面深入分析，发现以下 **7 个根本问题**：

### 根因 1: `record_usage()` 从未被调用（最关键）
- `token_repo::record_usage()` 函数已实现但 **从未在任何地方被调用**
- `token_usage` SQLite 表始终为空
- 导致设置页面 TokenUsageTab 查询数据库时始终返回 0
- 相关代码：[token_repo.rs:48](file:///d:/DeskTop/DocAgent/src-tauri/src/db/token_repo.rs#L48)

### 根因 2: `resetSession()` 从未在会话切换时被调用
- `useTokenStore.resetSession()` 只重置 `sessionTokens/inputTokens/outputTokens`
- 但 `handleNewSession` 和 `handleSwitchSession` 中 **从未调用** `resetSession()`
- 导致切换会话后，右侧栏仍显示上一次会话的 token 数据
- 相关代码：[App.tsx:403-410](file:///d:/DeskTop/DocAgent/src/App.tsx#L403-L410)

### 根因 3: 应用启动时从未从数据库加载历史 token 数据
- `useTokenStore` 初始化所有值为 0，没有从数据库加载历史数据的逻辑
- 导致应用重启后 token 数据全部归零
- 相关代码：[useTokenStore.ts:23-29](file:///d:/DeskTop/DocAgent/src/stores/useTokenStore.ts#L23-L29)

### 根因 4: Token 用量使用启发式估算而非 LLM API 实际返回值
- executor 使用字符数/2 的启发式算法估算 token（[executor.rs:448-460](file:///d:/DeskTop/DocAgent/src-tauri/src/services/agent/executor.rs#L448-L460)）
- LLM API 的非流式响应中包含 `usage` 字段，但流式模式下未提取
- OpenAI 支持 `stream_options: {"include_usage": true}` 获取流式用量，但未启用
- Anthropic 在 `message_start` 和 `message_delta` 事件中包含 usage，但未提取
- Gemini 在流式响应中包含 `usageMetadata`，但未提取

### 根因 5: `token:update` 事件的 `provider_id` 始终为空
- [agent.rs:335-341](file:///d:/DeskTop/DocAgent/src-tauri/src/commands/agent.rs#L335-L341) 中 `provider_id` 硬编码为 `String::new()`
- 导致无法按 Provider 分组统计用量

### 根因 6: `token:update` 事件的 `total_cost` 始终为 0
- [agent.rs:340](file:///d:/DeskTop/DocAgent/src-tauri/src/commands/agent.rs#L340) 中 `total_cost` 硬编码为 `0.0`
- 无费用计算逻辑

### 根因 7: 每次会话结束后未刷新累计统计
- `token:update` 事件只在前端内存中累加，但切换会话后 `dailyTotal/monthlyTotal` 不会重新从数据库加载
- 导致累计数据不准确

---

## 修复方案

### 第一阶段: 后端 - 持久化 Token 用量数据

#### 任务 1.1: 修改 `StreamChunk` 模型，增加可选的 `usage` 字段
**文件**: `src-tauri/src/models/llm.rs`
- 在 `StreamChunk` 结构体中添加 `pub usage: Option<ChatUsage>` 字段
- 这是后续从流式响应中提取 token 用量的基础

#### 任务 1.2: 修改 OpenAI 适配器，启用流式 usage 并解析
**文件**: `src-tauri/src/services/llm/openai_adapter.rs`
- 在 `build_request_body` 中，当 `stream=true` 时添加 `stream_options: {"include_usage": true}`
- 在流式解析逻辑中，当最后一个 chunk 包含 `usage` 字段时，将其解析为 `ChatUsage` 并放入 `StreamChunk.usage`

#### 任务 1.3: 修改 Anthropic 适配器，提取流式 usage
**文件**: `src-tauri/src/services/llm/anthropic_adapter.rs`
- 在 `message_start` 事件中提取 `message.usage.input_tokens`
- 在 `message_delta` 事件中提取 `usage.output_tokens`
- 将 usage 信息放入最后一个 `StreamChunk.usage`

#### 任务 1.4: 修改 Gemini 适配器，提取流式 usage
**文件**: `src-tauri/src/services/llm/gemini_adapter.rs`
- 在 `parse_stream_chunk` 中提取 `usageMetadata` 字段
- 将 usage 信息放入包含 `usageMetadata` 的 `StreamChunk.usage`

#### 任务 1.5: 修改 AgentExecutor，使用实际 token 用量
**文件**: `src-tauri/src/services/agent/executor.rs`
- 在流式响应收集循环中，检查每个 `StreamChunk.usage`
- 如果有实际 usage 数据，使用实际值替代启发式估算
- 如果没有，仍使用启发式估算作为 fallback
- 将 provider_id 和 model 信息通过 `ExecutionResult` 传出

#### 任务 1.6: 修改 `ExecutionResult`，增加 provider 和 model 字段
**文件**: `src-tauri/src/services/agent/executor.rs`
- 在 `ExecutionResult` 中添加 `provider_id: String` 和 `model: String` 字段
- 在执行开始时从 router 获取当前 provider 信息

#### 任务 1.7: 修改 `run_agent`，持久化 token 用量到数据库
**文件**: `src-tauri/src/commands/agent.rs`
- Agent 执行成功后，调用 `token_repo::record_usage()` 将 token 数据写入数据库
- 传入实际的 `provider_id`、`model`、`input_tokens`、`output_tokens`
- 修改 `emit_token_update` 事件，传入实际的 `provider_id`

---

### 第二阶段: 前端 - 修复 Token Store 初始化和会话切换

#### 任务 2.1: 修改 `useTokenStore`，增加从数据库加载初始数据的方法
**文件**: `src/stores/useTokenStore.ts`
- 添加 `loadInitialData()` 方法，调用 `getTokenUsageOverview()` 获取今日/本月累计
- 添加 `refreshDailyMonthly()` 方法，在每次 agent 完成后刷新累计数据
- 修改 `resetSession()` 方法，重置会话数据后自动刷新累计数据

#### 任务 2.2: 在 App.tsx 中初始化 token 数据
**文件**: `src/App.tsx`
- 在应用启动时调用 `loadInitialData()` 加载历史 token 数据
- 在 `handleNewSession` 中调用 `resetSession()`
- 在 `handleSwitchSession` 中调用 `resetSession()`

#### 任务 2.3: 修改 `TokenSection`，监听 agent 完成事件刷新累计数据
**文件**: `src/components/sidebar/TokenSection.tsx` 或 `src/stores/useTokenStore.ts`
- 在 `token:update` 事件处理中，除了累加会话数据外，同时刷新 `dailyTotal` 和 `monthlyTotal` 从数据库
- 或者在 agent:done 事件后刷新累计数据

---

### 第三阶段: 验证和测试

#### 任务 3.1: 编译验证
- 运行 `cargo build -p docagent_lib` 确保 Rust 代码编译通过
- 运行 `npx tsc -b` 确保 TypeScript 类型检查通过

#### 任务 3.2: 功能验证
- 启动应用，发送消息，验证右侧栏 token 统计正确显示
- 打开设置页面，验证 token 用量概览、趋势图、Provider 分布正确显示
- 新建会话，验证右侧栏 token 统计重置
- 关闭应用重新打开，验证 token 数据持久化
- 多次对话后，验证累计数据正确累加

---

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src-tauri/src/models/llm.rs` | 修改 | StreamChunk 增加 usage 字段 |
| `src-tauri/src/services/llm/openai_adapter.rs` | 修改 | 启用流式 usage，解析 usage 数据 |
| `src-tauri/src/services/llm/anthropic_adapter.rs` | 修改 | 提取流式 usage |
| `src-tauri/src/services/llm/gemini_adapter.rs` | 修改 | 提取流式 usage |
| `src-tauri/src/services/agent/executor.rs` | 修改 | 使用实际 usage，传出 provider/model |
| `src-tauri/src/commands/agent.rs` | 修改 | 持久化 token 数据，修正事件 payload |
| `src/stores/useTokenStore.ts` | 修改 | 增加数据库加载和刷新方法 |
| `src/App.tsx` | 修改 | 初始化 token 数据，会话切换时重置 |
