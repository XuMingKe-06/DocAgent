# 网络问题优化方案

## 一、现状分析

### 1.1 当前网络处理机制概览

| 层级 | 组件 | 当前机制 | 不足之处 |
|------|------|----------|----------|
| LLM 适配器 | OpenAI/Anthropic/Gemini | 指数退避重试(500ms*2^n)，最多3次，429/超时可重试 | 非网络错误(5xx)部分适配器未重试；连接错误统一报"网络错误"无细分 |
| LLM 路由器 | LlmRouter | Fallback机制，连续3次失败标记不可用，5分钟自动恢复 | 恢复检测依赖5分钟定时健康检查，网络恢复后无法立即感知 |
| Agent 执行器 | AgentExecutor | LLM调用失败直接终止Agent，流式错误break后终止 | 无执行器级重试；流式中断后不尝试恢复；部分内容丢失 |
| 前端 | useAgent/errorHandler | 错误码映射为中文提示，可恢复错误用warning | 无重试UI；无网络状态感知；错误后需手动重新输入 |
| 更新 | update.rs | 简单错误返回 | 无重试逻辑；下载中断无法断点续传 |
| 健康检查 | 后台定时任务 | LLM每5分钟，Sidecar每3分钟 | 使用真实API调用消耗token；网络恢复后最长等5分钟 |

### 1.2 已识别的12个网络问题

#### P0 - 严重影响用户体验

1. **Agent执行器无重试机制**：LLM调用失败（即使适配器已重试3次+Fallback）后，整个Agent执行直接终止。网络短暂波动就会导致用户任务中断，需要完全重新开始。

2. **流式响应中断不可恢复**：Agent执行过程中流式响应中断（网络抖动、WiFi切换），已接收的部分内容被丢弃，executor直接break并发射错误事件，无法从断点继续。

3. **无网络状态感知**：应用不知道系统网络是否在线/离线/切换中，无法在网络恢复时自动重试，也无法在断网时给用户明确提示（如"网络已断开，正在等待恢复..."）。

#### P1 - 影响使用流畅度

4. **Provider不可用恢复延迟**：Provider被标记为不可用后，需等待5分钟定时健康检查才能恢复。如果网络在10秒内恢复，用户仍需等待近5分钟。

5. **前端无重试入口**：Agent因网络错误终止后，用户必须手动重新输入消息重新开始，无法一键重试。

6. **网络切换后连接池残留**：切换网络（WiFi->以太网、VPN开关）后，reqwest客户端连接池中可能存在旧网络路径的失效连接，导致后续请求立即失败。

7. **健康检查消耗Token**：当前健康检查发送真实chat请求（"Hi"），每次消耗Token且可能触发频率限制。

#### P2 - 体验优化

8. **错误信息不够友好**：部分网络错误直接展示技术细节（如"网络错误: connection refused"），缺乏可操作的用户指引。

9. **DNS解析失败无特殊处理**：DNS解析失败作为普通网络错误处理，但DNS失败通常是网络切换后的瞬时问题，应更积极地重试。

10. **更新下载无重试和断点续传**：更新下载中断后无法恢复，需从头开始。

11. **流式客户端超时固定**：流式客户端300秒超时，长任务可能不够；且无保活机制。

12. **OpenAI适配器5xx未重试**：OpenAI适配器对5xx服务端错误不重试，但Anthropic适配器会重试5xx（除529外），行为不一致。

---

## 二、优化方案

### 2.1 Agent执行器级重试机制（P0）

**目标**：当LLM调用失败时，在Agent执行器层面增加重试，避免因短暂网络问题导致整个任务终止。

**方案**：

- 在 `AgentExecutor` 中新增 `max_llm_retries` 配置（默认2次）
- 当 `router.chat_stream` 返回错误时，不立即终止Agent，而是等待短暂间隔后重试
- 重试前检查 `should_stop`（用户是否手动停止）
- 重试时发射 `agent:network_retry` 事件通知前端，显示"正在重试连接..."
- 重试耗尽后才发射 `agent:error` 并终止Agent
- 仅对可重试的错误码重试（1001连接失败、1003限流、1006超时、1008流错误、1009不可用），认证失败(1002)、模型不存在(1005)等不重试

**涉及文件**：
- `src-tauri/src/services/agent/executor.rs`：增加LLM调用重试逻辑
- `src-tauri/src/events/types.rs`：新增 `NetworkRetryPayload` 和 `AGENT_NETWORK_RETRY` 事件
- `src-tauri/src/events/emitter.rs`：新增 `emit_network_retry` 方法
- `src/services/event.ts`：新增 `onAgentNetworkRetry` 监听函数
- `src/hooks/useAgent.ts`：处理网络重试事件

**重试策略**：
```
第1次重试：等待2秒
第2次重试：等待4秒
重试耗尽：发射agent:error终止
```

### 2.2 流式响应中断恢复（P0）

**目标**：当Agent执行过程中流式响应中断时，尝试从断点恢复，而非直接丢弃已接收内容。

**方案**：

- 在executor的流式接收循环中，当收到 `Err(e)` 时，不立即break
- 判断错误类型：如果是网络错误（连接中断、超时），且已有部分内容或tool_calls，尝试重新发起LLM请求
- 重新请求时，将已收集的assistant_content和reasoning_content作为上下文的一部分，让LLM继续生成
- 新增 `StreamRecoveryState` 结构体，追踪流式恢复状态
- 最多尝试恢复1次（避免无限循环），恢复失败才终止
- 恢复成功时发射 `agent:network_retry` 事件通知前端

**涉及文件**：
- `src-tauri/src/services/agent/executor.rs`：流式接收循环中增加恢复逻辑

**恢复策略**：
```
流式中断 -> 检查是否有部分内容
  -> 有：构造续写请求（添加assistant消息+用户"请继续"消息），重新调用LLM
  -> 无：按普通LLM调用失败处理（执行器级重试）
```

### 2.3 网络状态感知系统（P0）

**目标**：让应用感知系统网络连接状态，在网络断开/恢复时做出智能响应。

**方案**：

#### 后端（Rust）

- 新增 `NetworkMonitor` 服务，使用系统API检测网络状态变化
- Windows平台：使用 `is_network_available()` 或监听 `NetworkChange` 事件
- 跨平台方案：定期尝试DNS解析（如解析 `dns.google`）+ TCP连接测试，间隔10秒
- 网络状态变化时发射 `system:network_change` 事件到前端
- 网络恢复时，立即触发Provider健康检查（而非等待5分钟定时器）
- 网络恢复时，清除reqwest连接池中的失效连接

**涉及文件**：
- 新增 `src-tauri/src/services/network_monitor.rs`
- `src-tauri/src/lib.rs`：注册NetworkMonitor到AppState，启动后台监控任务
- `src-tauri/src/events/types.rs`：新增 `NetworkChangePayload` 和 `SYSTEM_NETWORK_CHANGE` 事件
- `src-tauri/src/services/llm/router.rs`：网络恢复时立即触发健康检查

#### 前端

- 监听 `system:network_change` 事件
- 网络断开时：在输入区域上方显示黄色横幅"网络已断开，部分功能可能不可用"
- 网络恢复时：显示绿色横幅"网络已恢复"（3秒后自动消失）
- Agent执行中网络断开：显示"网络中断，正在等待恢复..."，Agent执行器级重试会自动等待

**涉及文件**：
- `src/services/event.ts`：新增 `onSystemNetworkChange` 监听
- `src/stores/`：新增 `useNetworkStore` 或扩展现有store
- `src/components/layout/InputArea.tsx` 或 `MainArea.tsx`：显示网络状态横幅

### 2.4 Provider快速恢复机制（P1）

**目标**：网络恢复后，被标记为不可用的Provider能立即恢复，而非等待5分钟定时检查。

**方案**：

- `LlmRouter` 新增 `force_recover_all()` 方法，将所有Provider的 `is_available` 重置为true，`consecutive_failures` 清零
- `NetworkMonitor` 检测到网络恢复时，调用 `force_recover_all()`
- 同时重建reqwest客户端（清除连接池中的失效连接），通过在 `LlmRouter` 中新增 `rebuild_clients()` 方法实现
- 前端手动点击"检查连接"时，也调用 `force_recover_all()` + `health_check_all()`

**涉及文件**：
- `src-tauri/src/services/llm/router.rs`：新增 `force_recover_all()` 和 `rebuild_clients()`
- `src-tauri/src/services/network_monitor.rs`：网络恢复时调用
- `src-tauri/src/commands/llm.rs`：新增 `force_recover_providers` 命令

### 2.5 前端重试入口（P1）

**目标**：Agent因网络错误终止后，用户可以一键重试，无需重新输入消息。

**方案**：

- 在 `useAgent` hook 中保存最后一次发送的 `prompt` 和 `options`
- 当Agent因可恢复的网络错误终止时，在工作流时间线中显示"重试"按钮
- 点击重试按钮：使用保存的prompt和options重新调用 `startAgent`
- 新增 `agent:retry_available` 事件或在前端根据 `ErrorPayload.recoverable` 判断

**涉及文件**：
- `src/hooks/useAgent.ts`：保存lastPrompt，增加retryAgent方法
- `src/stores/useWorkflowStore.ts`：工作流节点增加retryable标记
- `src/components/workflow/WorkflowNode.tsx`：错误节点显示重试按钮

### 2.6 网络切换后连接池清理（P1）

**目标**：网络切换后自动清理失效连接，避免旧连接导致请求失败。

**方案**：

- 在 `NetworkMonitor` 检测到网络变化时，触发reqwest连接池清理
- reqwest的 `Client` 内部使用连接池，无法直接清理单个连接
- 方案：为每个LLM适配器新增 `rebuild_client()` 方法，创建新的 `Client` 实例替换旧的
- 在 `LlmRouter` 中新增 `rebuild_all_clients()` 方法，遍历所有Provider重建客户端
- 网络变化事件触发时调用此方法

**涉及文件**：
- `src-tauri/src/services/llm/openai_adapter.rs`：新增 `rebuild_client()`
- `src-tauri/src/services/llm/anthropic_adapter.rs`：新增 `rebuild_client()`
- `src-tauri/src/services/llm/gemini_adapter.rs`：新增 `rebuild_client()`
- `src-tauri/src/services/llm/provider.rs`：trait新增 `rebuild_client()`
- `src-tauri/src/services/llm/router.rs`：新增 `rebuild_all_clients()`

### 2.7 轻量级健康检查（P1）

**目标**：减少健康检查的Token消耗和频率限制触发。

**方案**：

- 优先使用轻量级连接测试：仅发送HTTP HEAD请求到API端点，检查是否可达
- 如果HEAD请求成功（或返回401/403，说明网络可达但认证问题），标记为可用
- 仅在HEAD请求不可行时（如某些API不支持HEAD），回退到当前的真实请求方式
- OpenAI: HEAD `https://api.openai.com/v1/models`
- Anthropic: HEAD `https://api.anthropic.com/v1/messages`（返回405也说明可达）
- Gemini: HEAD `https://generativelanguage.googleapis.com/`（返回200/403说明可达）

**涉及文件**：
- `src-tauri/src/services/llm/openai_adapter.rs`：新增 `lightweight_health_check()`
- `src-tauri/src/services/llm/anthropic_adapter.rs`：新增 `lightweight_health_check()`
- `src-tauri/src/services/llm/gemini_adapter.rs`：新增 `lightweight_health_check()`
- `src-tauri/src/services/llm/provider.rs`：trait新增 `lightweight_health_check()`，默认调用 `test_connection()`
- `src-tauri/src/services/llm/router.rs`：`health_check_all()` 优先使用轻量级检查

### 2.8 错误信息友好化（P2）

**目标**：网络相关错误提供更友好、可操作的用户提示。

**方案**：

- 在 `errorHandler.ts` 中细化网络错误映射：
  - 连接失败 -> "无法连接到AI服务，请检查网络连接和API地址是否正确"
  - DNS解析失败 -> "网络DNS解析失败，请检查网络连接或尝试切换网络"
  - 连接被拒绝 -> "AI服务拒绝连接，请检查API地址是否正确"
  - SSL/TLS错误 -> "安全连接失败，请检查系统时间是否正确"
  - 连接超时 -> "连接AI服务超时，请检查网络是否正常"
- 在executor中，将reqwest原始错误进一步分类，映射到更精确的错误码
- 新增错误码：
  - `1011`: DNS解析失败
  - `1012`: 连接被拒绝
  - `1013`: SSL/TLS握手失败
  - `1014`: 网络不可达

**涉及文件**：
- `src-tauri/src/errors.rs`：新增错误码
- `src-tauri/src/services/llm/openai_adapter.rs`：细化错误分类
- `src-tauri/src/services/llm/anthropic_adapter.rs`：细化错误分类
- `src-tauri/src/services/llm/gemini_adapter.rs`：细化错误分类
- `src/services/errorHandler.ts`：新增错误码映射

### 2.9 DNS解析失败特殊处理（P2）

**目标**：DNS解析失败时更积极地重试，因为DNS失败通常是网络切换后的瞬时问题。

**方案**：

- 在适配器的 `send_with_retry_internal` 中，检测reqwest错误是否为DNS解析失败
- DNS解析失败时，使用更短的重试间隔（200ms而非500ms*2^n）
- DNS解析失败时，额外增加1次重试机会
- 检测方式：reqwest错误消息中包含 "dns"、"resolve"、"name resolution" 等关键词

**涉及文件**：
- `src-tauri/src/services/llm/openai_adapter.rs`
- `src-tauri/src/services/llm/anthropic_adapter.rs`
- `src-tauri/src/services/llm/gemini_adapter.rs`

### 2.10 更新下载重试（P2）

**目标**：更新下载失败时自动重试，提升更新成功率。

**方案**：

- 在 `download_and_install_update` 命令中增加重试逻辑
- 下载失败时最多重试2次，间隔3秒
- 重试时重新检查更新（避免下载已过期的更新包）
- 前端在更新下载失败时显示"重试"按钮

**涉及文件**：
- `src-tauri/src/commands/update.rs`：增加重试逻辑

### 2.11 OpenAI适配器5xx重试一致性（P2）

**目标**：三个适配器对5xx服务端错误的重试行为保持一致。

**方案**：

- OpenAI适配器：增加5xx重试逻辑（与Anthropic适配器一致）
- Gemini适配器：增加5xx重试逻辑
- 统一行为：5xx错误（除特殊码如529外）在 `attempt < max_retries` 时重试

**涉及文件**：
- `src-tauri/src/services/llm/openai_adapter.rs`
- `src-tauri/src/services/llm/gemini_adapter.rs`

### 2.12 流式保活机制（P2）

**目标**：长时间流式响应中保持连接活跃，避免因空闲超时断开。

**方案**：

- 在流式客户端配置中增加 `tcp_keepalive` 选项（60秒间隔）
- 在 `Client::builder()` 中设置 `.tcp_keepalive(Some(Duration::from_secs(60)))`
- 三个适配器统一添加此配置

**涉及文件**：
- `src-tauri/src/services/llm/openai_adapter.rs`
- `src-tauri/src/services/llm/anthropic_adapter.rs`
- `src-tauri/src/services/llm/gemini_adapter.rs`

---

## 三、实施优先级与依赖关系

```
阶段1（核心能力）:
  2.1 Agent执行器级重试 ──────────────────┐
  2.3 网络状态感知系统 ──────────────────┤── 无依赖，可并行
  2.12 流式保活机制 ─────────────────────┘

阶段2（恢复能力，依赖阶段1）:
  2.2 流式响应中断恢复 ── 依赖 2.1
  2.4 Provider快速恢复 ── 依赖 2.3
  2.6 连接池清理 ──────── 依赖 2.3

阶段3（用户体验，依赖阶段2）:
  2.5 前端重试入口 ────── 依赖 2.1
  2.7 轻量级健康检查 ──── 依赖 2.4
  2.8 错误信息友好化 ──── 依赖 2.1（新错误码）

阶段4（锦上添花，可独立实施）:
  2.9 DNS解析特殊处理
  2.10 更新下载重试
  2.11 5xx重试一致性
```

---

## 四、新增事件与错误码汇总

### 4.1 新增事件

| 事件名 | Payload | 触发时机 |
|--------|---------|----------|
| `agent:network_retry` | `{ sessionId, attempt, maxAttempts, reason }` | Agent执行器级LLM调用重试时 |
| `system:network_change` | `{ status: "online" \| "offline", previousStatus }` | 系统网络状态变化时 |

### 4.2 新增错误码

| 错误码 | 含义 | 用户提示 |
|--------|------|----------|
| 1011 | DNS解析失败 | "网络DNS解析失败，请检查网络连接或尝试切换网络" |
| 1012 | 连接被拒绝 | "AI服务拒绝连接，请检查API地址是否正确" |
| 1013 | SSL/TLS握手失败 | "安全连接失败，请检查系统时间是否正确" |
| 1014 | 网络不可达 | "网络不可达，请检查网络连接" |

### 4.3 新增Tauri命令

| 命令名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `force_recover_providers` | 无 | `()` | 强制恢复所有Provider为可用状态 |
| `get_network_status` | 无 | `{ status: "online" \| "offline" }` | 获取当前网络状态 |

---

## 五、关键设计决策

### 5.1 为什么不在适配器层增加更多重试？

当前适配器已有3次重试+指数退避，继续增加重试次数会显著延长用户等待时间。更好的策略是在执行器层增加重试，因为执行器可以在重试前检查网络状态和用户停止意愿，避免无意义的重试。

### 5.2 为什么流式恢复只尝试1次？

流式恢复需要构造续写请求，多次恢复可能导致上下文混乱和重复内容。1次恢复足以应对短暂网络抖动，持续的网络问题应由用户决定是否继续。

### 5.3 为什么选择定期DNS解析而非系统API？

- 跨平台兼容性：系统网络API在各平台差异大（Windows的NLA、Linux的NetworkManager）
- Tauri 2.x暂无网络状态插件
- 定期DNS解析方案简单可靠，10秒间隔的DNS查询开销极小
- 可以后续替换为tauri-plugin-network等官方插件

### 5.4 为什么重建Client而非清理连接池？

reqwest的 `Client` 不暴露连接池清理API。创建新 `Client` 实例是唯一可靠的方式。由于Client创建开销很小（仅配置，无实际连接），重建是可接受的方案。

---

## 六、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 流式恢复导致内容重复 | 用户看到重复文本 | 恢复时在system prompt中明确指示"请继续，不要重复已输出内容" |
| 网络监控误报（短暂DNS超时） | 不必要的Provider恢复 | 连续2次DNS失败才判定为离线，1次成功即判定为在线 |
| 执行器重试延长用户等待 | 用户以为卡住 | 发射 `agent:network_retry` 事件，前端显示重试进度 |
| 重建Client导致进行中的请求失败 | 正在执行的LLM调用中断 | 仅在网络变化时重建，且在无活跃Agent时执行 |
| 轻量级健康检查误判（API可达但模型不可用） | 不可用Provider被标记为可用 | 标记为可用后，首次真实请求失败会立即重新标记为不可用 |

---

## 七、测试要点

### 7.1 手动测试场景

1. **网络断开恢复**：Agent执行中断开WiFi，观察错误提示和重试行为；恢复WiFi后观察自动恢复
2. **网络切换**：WiFi切换到以太网，观察连接池清理和Provider恢复
3. **VPN开关**：开关VPN，观察API连接是否正常恢复
4. **DNS切换**：切换DNS服务器，观察DNS重试行为
5. **限流恢复**：触发429限流，观察重试和恢复
6. **长时间流式**：执行长任务，观察TCP保活是否生效
7. **流式中断恢复**：在流式响应中间断开网络，观察恢复行为

### 7.2 自动化测试方向

- 单元测试：`NetworkMonitor` 的在线/离线判定逻辑
- 单元测试：执行器重试逻辑（mock LLM返回网络错误）
- 单元测试：流式恢复逻辑（mock流式中断）
- 集成测试：Provider快速恢复流程
