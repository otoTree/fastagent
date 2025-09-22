// API Response Types
export interface ApiResponse<T = any> {
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

// Pagination Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// User Types
export interface User {
  _id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateModelConfigInput {
  name: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  modelType?: 'chat' | 'completion' | 'embedding';
  apiEndpoint?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  isActive?: boolean;
  isDefault?: boolean;
  description?: string;
  capabilities?: string[];
  pricing?: {
    inputTokenPrice: number;
    outputTokenPrice: number;
    currency?: string;
  };
  rateLimits?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

export interface UpdateModelConfigInput extends Partial<CreateModelConfigInput> {
  _id?: string;
}

// Webhook Trigger Types
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
  lastTriggeredAt?: Date;
  triggerCount: number;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookTriggerInput {
  name: string;
  description?: string;
  agentId: string;
  apiKey?: string;
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

export interface WebhookTriggerResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
}

export interface WebhookExecutionLog {
  _id: string;
  triggerId: string;
  agentId: string;
  requestData: any;
  responseData: any;
  statusCode: number;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

// Project Management Types
export interface Project {
  _id: string;
  name: string;
  description?: string;
  agentId: string;
  webhookTriggers: string[];
  isActive: boolean;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
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

// Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}