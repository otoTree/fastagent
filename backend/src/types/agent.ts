import { AgentStatus } from './redis';

// Agent配置
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  modelConfig: {
    provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  systemPrompt?: string;
  capabilities: string[];
  tools?: string[];
  isActive: boolean;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

// Agent Runtime注册请求
export interface AgentRuntimeRegistration {
  runtimeId: string;
  agentId: string;
  name: string;
  description?: string;
  capabilities: string[];
  metadata: {
    version: string;
    host: string;
    port: number;
    pid: number;
  };
  config?: {
    maxConcurrentTasks?: number;
    taskTimeout?: number;
    heartbeatInterval?: number;
  };
}

// Agent Runtime状态更新
export interface AgentRuntimeStatusUpdate {
  runtimeId: string;
  agentId: string;
  status: AgentStatus;
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    activeTasks?: number;
    queueSize?: number;
  };
}

// Agent Runtime信息
export interface AgentRuntimeInfo {
  runtimeId: string;
  agentId: string;
  name: string;
  description?: string;
  status: AgentStatus;
  capabilities: string[];
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
    interval: number;
  };
  config?: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    heartbeatInterval: number;
  };
}

// Agent统计信息
export interface AgentStats {
  agentId: string;
  runtimeCount: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  successRate: number;
  lastActiveAt?: number;
  status: AgentStatus;
}

// Agent列表查询参数
export interface AgentQueryParams {
  status?: AgentStatus;
  capability?: string;
  owner?: string;
  page?: number;
  limit?: number;
  sort?: 'name' | 'createdAt' | 'lastActiveAt';
  order?: 'asc' | 'desc';
}

// Agent列表响应
export interface AgentListResponse {
  agents: AgentRuntimeInfo[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Agent能力定义
export interface AgentCapability {
  name: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

// Agent工具定义
export interface AgentTool {
  name: string;
  description: string;
  schema: any; // JSON Schema
}

// Agent执行结果
export interface AgentExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  tokens?: {
    input: number;
    output: number;
  };
  metadata?: {
    model?: string;
    temperature?: number;
    toolCalls?: any[];
  };
}

// Agent健康检查响应
export interface AgentHealthCheck {
  runtimeId: string;
  agentId: string;
  status: AgentStatus;
  uptime: number;
  version: string;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    activeTasks: number;
    queueSize: number;
  };
  lastError?: string;
  timestamp: number;
}