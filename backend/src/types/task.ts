import { TaskStatus, TaskPriority, TriggerType } from './redis';
import { z } from 'zod';

// Zod模式定义
export const TaskInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').optional(),
  data: z.any().optional(),
  context: z.record(z.any()).optional()
});

export const CreateTaskRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  projectId: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  input: TaskInputSchema,
  timeout: z.number().min(1000).max(300000).optional(),
  maxRetries: z.number().min(0).max(5).optional()
});

export const TaskStatusQuerySchema = z.object({
  taskId: z.string().min(1, 'Task ID is required')
});

// 创建任务请求
export interface CreateTaskRequest {
  agentId: string;
  triggerType: TriggerType;
  triggerId?: string;
  priority?: TaskPriority;
  input: {
    prompt?: string;
    data?: any;
    context?: Record<string, any>;
  };
  metadata?: {
    projectId?: string;
    source?: string;
    timeout?: number;
    maxRetries?: number;
  };
}

// 任务响应
export interface TaskResponse {
  id: string;
  status: TaskStatus;
  createdAt: number;
  estimatedCompletionTime?: number;
}

// 任务状态查询响应
export interface TaskStatusResponse {
  id: string;
  agentId: string;
  status: TaskStatus;
  progress?: number; // 0-100
  input: {
    prompt?: string;
    data?: any;
    context?: Record<string, any>;
  };
  result?: {
    output?: any;
    error?: string;
    executionTime?: number;
    tokens?: {
      input: number;
      output: number;
    };
  };
  timestamps: {
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    updatedAt: number;
  };
}

// 批量任务请求
export interface BatchTaskRequest {
  tasks: CreateTaskRequest[];
  batchId?: string;
  priority?: TaskPriority;
  metadata?: {
    description?: string;
    source?: string;
  };
}

// 批量任务响应
export interface BatchTaskResponse {
  batchId: string;
  taskIds: string[];
  totalTasks: number;
  createdAt: number;
}

// 任务统计
export interface TaskStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageExecutionTime: number;
  successRate: number;
}

// 任务查询参数
export interface TaskQueryParams {
  agentId?: string;
  status?: TaskStatus;
  triggerType?: TriggerType;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'updatedAt' | 'priority';
  order?: 'asc' | 'desc';
}

// 任务列表响应
export interface TaskListResponse {
  tasks: TaskStatusResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Webhook任务数据
export interface WebhookTaskData {
  webhookId: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  ip: string;
  userAgent?: string;
}

// API任务数据
export interface ApiTaskData {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  userId: string;
}

// 定时任务数据
export interface ScheduleTaskData {
  scheduleId: string;
  cronExpression: string;
  timezone?: string;
  executionCount: number;
}

// 任务执行上下文
export interface TaskExecutionContext {
  taskId: string;
  agentId: string;
  runtimeId: string;
  startedAt: number;
  timeout: number;
  retryCount: number;
  maxRetries: number;
}

// 任务取消请求
export interface CancelTaskRequest {
  taskId: string;
  reason?: string;
}

// 任务重试请求
export interface RetryTaskRequest {
  taskId: string;
  resetRetryCount?: boolean;
}

// 任务更新请求
export interface UpdateTaskRequest {
  taskId: string;
  status?: TaskStatus;
  progress?: number;
  result?: {
    output?: any;
    error?: string;
    executionTime?: number;
    tokens?: {
      input: number;
      output: number;
    };
  };
}