import { z } from 'zod';

// Agent状态枚举
export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline'
}

// Agent配置
export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  prompt: z.string(),
  modelName: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4096).default(1000),
  capabilities: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]), // 工具ID列表
  maxConcurrentTasks: z.number().default(5),
  timeout: z.number().default(300000) // 5分钟默认超时
});

// Agent运行时状态
export const AgentRuntimeStateSchema = z.object({
  status: z.nativeEnum(AgentStatus),
  currentTasks: z.array(z.string()).default([]), // 当前执行的任务ID列表
  lastActivity: z.coerce.date().optional(),
  errorMessage: z.string().optional(),
  metrics: z.object({
    totalTasks: z.number().default(0),
    completedTasks: z.number().default(0),
    failedTasks: z.number().default(0),
    averageExecutionTime: z.number().default(0)
  }).default({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0
  })
});

// Agent实例
export const AgentInstanceSchema = z.object({
  config: AgentConfigSchema,
  state: AgentRuntimeStateSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

// 工具调用请求
export const ToolCallRequestSchema = z.object({
  toolId: z.string(),
  input: z.record(z.any()),
  timeout: z.number().optional()
});

// Agent执行请求
export const AgentExecutionRequestSchema = z.object({
  agentId: z.string(),
  input: z.string(),
  context: z.record(z.any()).optional(),
  tools: z.array(ToolCallRequestSchema).optional(),
  stream: z.boolean().default(false)
});

// Agent执行响应
export const AgentExecutionResponseSchema = z.object({
  output: z.string(),
  toolCalls: z.array(z.object({
    toolId: z.string(),
    input: z.record(z.any()),
    output: z.record(z.any()).optional(),
    error: z.string().optional()
  })).default([]),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number()
  }).optional(),
  executionTime: z.number()
});

// TypeScript类型导出
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentRuntimeState = z.infer<typeof AgentRuntimeStateSchema>;
export type AgentInstance = z.infer<typeof AgentInstanceSchema>;
export type ToolCallRequest = z.infer<typeof ToolCallRequestSchema>;
export type AgentExecutionRequest = z.infer<typeof AgentExecutionRequestSchema>;
export type AgentExecutionResponse = z.infer<typeof AgentExecutionResponseSchema>;