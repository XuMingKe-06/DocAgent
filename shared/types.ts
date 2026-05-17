/**
 * 前后端共享类型定义
 * 这些类型同时被 Rust 后端（serde）和 TypeScript 前端使用
 */

// 工作流节点类型（与 Rust 端同步）
export type NodeType = "user" | "thinking" | "tool" | "result" | "reply" | "confirm";

// 执行状态（与 Rust 端同步）
export type ExecutionStatus = "idle" | "running" | "paused" | "completed" | "failed" | "cancelled";
