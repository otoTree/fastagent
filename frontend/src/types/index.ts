// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
    stack?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// User Types
export interface User {
  _id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Project Types
export interface Project {
  _id: string;
  name: string;
  description?: string;
  agentId: string;
  triggers: string[];
  isActive: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

// 触发器日志类型
export interface TriggerLog {
  _id: string;
  triggerId: string;
  projectId: string;
  agentId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'success' | 'error' | 'timeout';
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  errorMessage?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  trigger?: {
    _id: string;
    name: string;
    type: string;
  };
  project?: {
    _id: string;
    name: string;
  };
  agent?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  agentId: string;
  isActive?: boolean;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  _id?: string;
}

// Trigger Types (通用触发器)
export type TriggerType = 'webhook' | 'schedule' | 'event' | 'api';
export type TriggerStatus = 'active' | 'inactive' | 'paused' | 'error';

export interface WebhookConfig {
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  responseFormat: 'json' | 'text' | 'html';
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

export interface ScheduleConfig {
  cronExpression: string;
  timezone: string;
  nextRunAt?: string;
}

export interface EventConfig {
  eventType: string;
  conditions?: Record<string, unknown>;
}

export interface ApiConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

export type TriggerConfig = WebhookConfig | ScheduleConfig | EventConfig | ApiConfig;

// 通用触发器接口
export interface Trigger {
  _id: string;
  name: string;
  description?: string;
  type: TriggerType;
  projectId: string;
  agentId: string;
  config: TriggerConfig;
  status: TriggerStatus;
  isActive: boolean;
  webhookUrl?: string; // 仅webhook类型
  apiKey?: string; // 仅webhook类型
  triggerCount: number;
  lastTriggeredAt?: string;
  lastError?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

// Webhook触发器接口（向后兼容）
export interface WebhookTrigger extends Trigger {
  type: 'webhook';
  config: WebhookConfig;
  webhookUrl: string;
  apiKey: string;
  // 为了向后兼容，添加直接访问的属性
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  responseFormat: 'json' | 'text' | 'html';
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

export interface CreateTriggerInput {
  name: string;
  description?: string;
  type: TriggerType;
  projectId: string;
  agentId: string;
  config: TriggerConfig;
  isActive?: boolean;
}

export interface CreateWebhookTriggerInput {
  name: string;
  description?: string;
  agentId: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  responseFormat?: 'json' | 'text' | 'html';
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  isActive?: boolean;
}

export interface UpdateTriggerInput extends Partial<CreateTriggerInput> {
  _id?: string;
}

// 兼容性类型定义 (向后兼容)
export interface WebhookTrigger {
  _id: string;
  name: string;
  description?: string;
  agentId: string;
  webhookUrl: string;
  apiKey: string;
  isActive: boolean;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  responseFormat: 'json' | 'text' | 'html';
  timeout: number;
  retryCount: number;
  retryDelay: number;
  lastTriggeredAt?: string;
  triggerCount: number;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookTriggerInput {
  name: string;
  description?: string;
  agentId: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  responseFormat?: 'json' | 'text' | 'html';
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  isActive?: boolean;
}

export interface UpdateWebhookTriggerInput extends Partial<CreateWebhookTriggerInput> {
  _id?: string;
}

// Model Configuration Types
export interface ModelConfig {
  _id: string;
  name: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  modelType: 'chat' | 'completion' | 'embedding';
  apiEndpoint?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  isActive: boolean;
  isDefault: boolean;
  description?: string;
  capabilities: string[];
  pricing?: {
    inputTokenPrice: number;
    outputTokenPrice: number;
    currency: string;
  };
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  owner: string;
  createdAt: string;
  updatedAt: string;
}