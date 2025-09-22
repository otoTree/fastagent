import { z } from 'zod';

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 任务类型枚举
export enum TaskType {
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  EVENT = 'event',
  API = 'api',
  MANUAL = 'manual'
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 工具调用结果
export const ToolCallResultSchema = z.object({
  toolId: z.string(),
  toolName: z.string(),
  input: z.record(z.any()),
  output: z.record(z.any()).optional(),
  error: z.string().optional(),
  duration: z.number().optional(),
  timestamp: z.coerce.date()
});

// 任务执行上下文
export const TaskContextSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  agentId: z.string(),
  triggerId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// 任务输入数据
export const TaskInputSchema = z.object({
  type: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  context: TaskContextSchema,
  payload: z.record(z.any()),
  timeout: z.number().default(300000), // 5分钟默认超时
  retryCount: z.number().default(3),
  scheduledAt: z.coerce.date().optional()
});

// 任务执行结果
export const TaskResultSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  output: z.record(z.any()).optional(),
  error: z.string().optional(),
  toolCalls: z.array(ToolCallResultSchema).default([]),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  duration: z.number().optional(),
  retryAttempts: z.number().default(0)
});

// 完整任务定义
export const TaskSchema = z.object({
  id: z.string(),
  input: TaskInputSchema,
  result: TaskResultSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

// TypeScript类型导出
export type ToolCallResult = z.infer<typeof ToolCallResultSchema>;
export type TaskContext = z.infer<typeof TaskContextSchema>;
export type TaskInput = z.infer<typeof TaskInputSchema>;
export type TaskResult = z.infer<typeof TaskResultSchema>;
export type Task = z.infer<typeof TaskSchema>;

// 任务创建请求
export const CreateTaskRequestSchema = z.object({
  type: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority).optional(),
  agentId: z.string(),
  projectId: z.string(),
  triggerId: z.string().optional(),
  payload: z.record(z.any()),
  timeout: z.number().optional(),
  scheduledAt: z.coerce.date().optional()
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;