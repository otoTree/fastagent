// Redis数据结构类型定义

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  URGENT = 'urgent'
}

// 触发器类型枚举
export enum TriggerType {
  WEBHOOK = 'webhook',
  API = 'api',
  SCHEDULE = 'schedule',
  MANUAL = 'manual'
}

// Agent状态枚举
export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  ERROR = 'error'
}

// Redis中的任务数据结构
export interface RedisTask {
  id: string;
  agentId: string;
  triggerType: TriggerType;
  triggerId?: string; // webhook ID, API endpoint ID等
  priority: TaskPriority;
  status: TaskStatus;
  input: {
    prompt?: string;
    data?: any;
    context?: Record<string, any>;
  };
  metadata: {
    userId: string;
    projectId?: string;
    source: string; // 来源标识
    timeout: number; // 超时时间(ms)
    retryCount: number; // 重试次数
    maxRetries: number; // 最大重试次数
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

// Agent注册信息
export interface AgentRegistration {
  id: string;
  runtimeId: string; // Agent Runtime实例ID
  name: string;
  description?: string;
  capabilities: string[]; // 支持的能力列表
  status: AgentStatus;
  metadata: {
    version: string;
    host: string;
    port: number;
    pid: number;
    startedAt: number;
  };
  performance: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
    lastTaskAt?: number;
  };
  heartbeat: {
    lastHeartbeatAt: number;
    interval: number; // 心跳间隔(ms)
  };
}

// Agent Runtime心跳数据
export interface AgentHeartbeat {
  runtimeId: string;
  agentId: string;
  timestamp: number;
  status: AgentStatus;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    activeTasks: number;
    queueSize: number;
  };
}

// 任务执行结果
export interface TaskResult {
  taskId: string;
  agentId: string;
  status: TaskStatus;
  output?: any;
  error?: string;
  executionTime: number;
  tokens?: {
    input: number;
    output: number;
  };
  completedAt: number;
}

// Redis键名常量
export const REDIS_KEYS = {
  // 任务队列相关
  TASK_QUEUE: 'fastagent:tasks:queue', // 待处理任务队列
  TASK_PROCESSING: 'fastagent:tasks:processing', // 正在处理的任务
  TASK_COMPLETED: 'fastagent:tasks:completed', // 已完成任务
  TASK_FAILED: 'fastagent:tasks:failed', // 失败任务
  TASK_DATA: (taskId: string) => `fastagent:task:${taskId}`, // 任务详细数据
  
  // Agent相关
  AGENT_REGISTRY: 'fastagent:agents:registry', // Agent注册表
  AGENT_HEARTBEAT: (agentId: string) => `fastagent:agent:${agentId}:heartbeat`, // Agent心跳
  AGENT_STATUS: (agentId: string) => `fastagent:agent:${agentId}:status`, // Agent状态
  
  // 统计相关
  STATS_TASKS: 'fastagent:stats:tasks', // 任务统计
  STATS_AGENTS: 'fastagent:stats:agents', // Agent统计
  
  // 锁相关
  TASK_LOCK: (taskId: string) => `fastagent:lock:task:${taskId}`, // 任务锁
  AGENT_LOCK: (agentId: string) => `fastagent:lock:agent:${agentId}`, // Agent锁
} as const;