import axios from 'axios';
import { 
  ApiResponse, 
  User, 
  AuthResponse, 
  LoginInput, 
  CreateUserInput,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  WebhookTrigger,
  CreateWebhookTriggerInput,
  UpdateWebhookTriggerInput,
  Trigger,
  CreateTriggerInput,
  UpdateTriggerInput,
  TriggerLog
} from '@/types';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api',
  timeout: 10000,
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use((config) => {
  // Try to get token from Zustand persist storage (consistent with auth store)
  let token = null;
  
  if (typeof window !== 'undefined') {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedStorage = JSON.parse(authStorage);
        token = parsedStorage.state?.token;
      }
    } catch (error) {
      console.error('Error parsing auth storage:', error);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth storage and redirect to login (consistent with lib/api.ts)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authApi = {
  // 用户登录
  login: async (data: LoginInput): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // 用户注册
  register: async (data: CreateUserInput): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 用户登出
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// 项目相关API
export const projectApi = {
  // 获取项目列表
  getProjects: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
  }): Promise<ApiResponse<Project[]>> => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // 获取单个项目
  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // 创建项目
  createProject: async (data: CreateProjectInput): Promise<ApiResponse<Project>> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  // 更新项目
  updateProject: async (id: string, data: UpdateProjectInput): Promise<ApiResponse<Project>> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // 删除项目
  deleteProject: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

// 通用触发器API
export const triggerApi = {
  // 获取触发器列表
  getTriggers: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    projectId?: string;
    type?: string;
  }): Promise<ApiResponse<Trigger[]>> => {
    const response = await api.get('/triggers', { params });
    return response.data;
  },

  // 获取单个触发器
  getTrigger: async (id: string): Promise<ApiResponse<Trigger>> => {
    const response = await api.get(`/triggers/${id}`);
    return response.data;
  },

  // 创建触发器
  createTrigger: async (data: CreateTriggerInput): Promise<ApiResponse<Trigger>> => {
    const response = await api.post('/triggers', data);
    return response.data;
  },

  // 更新触发器
  updateTrigger: async (id: string, data: UpdateTriggerInput): Promise<ApiResponse<Trigger>> => {
    const response = await api.put(`/triggers/${id}`, data);
    return response.data;
  },

  // 删除触发器
  deleteTrigger: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/triggers/${id}`);
    return response.data;
  },

  // 重新生成API密钥
  regenerateApiKey: async (id: string): Promise<ApiResponse<{ apiKey: string }>> => {
    const response = await api.post(`/triggers/${id}/regenerate-key`);
    return response.data;
  },

  // 切换触发器状态
  toggleTrigger: async (id: string): Promise<ApiResponse<Trigger>> => {
    const response = await api.post(`/triggers/${id}/toggle`);
    return response.data;
  },

  // 获取触发器统计信息
  getTriggerStats: async (id: string): Promise<ApiResponse<{
    totalTriggers: number;
    activeTriggers: number;
    totalExecutions: number;
    successRate: number;
  }>> => {
    const response = await api.get(`/triggers/${id}/stats`);
    return response.data;
  },

  // 手动触发
  triggerManually: async (id: string, data?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.post(`/triggers/${id}/trigger`, data);
    return response.data;
  },
};

// 触发器日志API
export const triggerLogApi = {
  // 获取触发器日志列表
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    triggerId?: string;
    projectId?: string;
    agentId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse<TriggerLog[]>> => {
    const response = await api.get('/trigger-logs', { params });
    return response.data;
  },

  // 获取单个触发器日志详情
  getLog: async (id: string): Promise<ApiResponse<TriggerLog>> => {
    const response = await api.get(`/trigger-logs/${id}`);
    return response.data;
  },

  // 获取触发器日志统计信息
  getStats: async (): Promise<ApiResponse<{
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    successRate: string;
    avgExecutionTime: number;
    statusStats: Record<string, number>;
    dailyStats: Array<{
      _id: string;
      count: number;
      successCount: number;
      failedCount: number;
    }>;
  }>> => {
    const response = await api.get('/trigger-logs/stats/overview');
    return response.data;
  },

  // 删除触发器日志
  deleteLog: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/trigger-logs/${id}`);
    return response.data;
  },
};

// Webhook触发器API (向后兼容)
export const webhookApi = {
  // 获取所有webhook触发器
  getAll: async (params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    agentId?: string;
  }): Promise<ApiResponse<WebhookTrigger[]>> => {
    const response = await api.get('/triggers', { params: { ...params, type: 'webhook' } });
    return response.data;
  },

  // 根据ID获取webhook触发器
  getById: async (id: string): Promise<ApiResponse<WebhookTrigger>> => {
    const response = await api.get(`/triggers/${id}`);
    return response.data;
  },

  // 创建webhook触发器
  create: async (data: CreateWebhookTriggerInput & { projectId: string }): Promise<ApiResponse<WebhookTrigger>> => {
    // 转换为通用触发器格式
    const triggerData: CreateTriggerInput = {
      name: data.name,
      description: data.description,
      type: 'webhook',
      projectId: data.projectId,
      agentId: data.agentId,
      config: {
        httpMethod: data.httpMethod || 'POST',
        headers: data.headers,
        responseFormat: data.responseFormat || 'json',
        timeout: data.timeout || 30000,
        retryCount: data.retryCount || 3,
        retryDelay: data.retryDelay || 1000,
      },
      isActive: data.isActive ?? true,
    };
    const response = await api.post('/triggers', triggerData);
    return response.data;
  },

  // 更新webhook触发器
  update: async (id: string, data: UpdateWebhookTriggerInput): Promise<ApiResponse<WebhookTrigger>> => {
    const response = await api.put(`/triggers/${id}`, data);
    return response.data;
  },

  // 删除webhook触发器
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/triggers/${id}`);
    return response.data;
  },

  // 重新生成API密钥
  regenerateApiKey: async (id: string): Promise<ApiResponse<{ apiKey: string }>> => {
    const response = await api.post(`/triggers/${id}/regenerate-key`);
    return response.data;
  },

  // 手动触发webhook
  trigger: async (id: string, data?: unknown): Promise<ApiResponse<unknown>> => {
    const response = await api.post(`/triggers/${id}/trigger`, data);
    return response.data;
  },

  // 获取执行日志
  getLogs: async (id: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    _id: string;
    triggerId: string;
    agentId: string;
    requestData: Record<string, unknown>;
    responseData: Record<string, unknown>;
    statusCode: number;
    executionTime: number;
    success: boolean;
    errorMessage?: string;
    createdAt: string;
  }>>> => {
    const response = await api.get(`/triggers/${id}/logs`, { params });
    return response.data;
  },

  // Legacy methods for backward compatibility
  getWebhookTriggers: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    agentId?: string; 
  }): Promise<ApiResponse<WebhookTrigger[]>> => {
    const response = await api.get('/webhooks', { params });
    return response.data;
  },

  getWebhookTrigger: async (id: string): Promise<ApiResponse<WebhookTrigger>> => {
    const response = await api.get(`/webhooks/${id}`);
    return response.data;
  },

  createWebhookTrigger: async (data: CreateWebhookTriggerInput): Promise<ApiResponse<WebhookTrigger>> => {
    const response = await api.post('/webhooks', data);
    return response.data;
  },

  updateWebhookTrigger: async (id: string, data: UpdateWebhookTriggerInput): Promise<ApiResponse<WebhookTrigger>> => {
    const response = await api.put(`/webhooks/${id}`, data);
    return response.data;
  },

  deleteWebhookTrigger: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/webhooks/${id}`);
    return response.data;
  },

  getWebhookLogs: async (id: string, params?: { 
    page?: number; 
    limit?: number; 
  }): Promise<ApiResponse<Array<{
    _id: string;
    triggerId: string;
    agentId: string;
    requestData: Record<string, unknown>;
    responseData: Record<string, unknown>;
    statusCode: number;
    executionTime: number;
    success: boolean;
    errorMessage?: string;
    createdAt: string;
  }>>> => {
    const response = await api.get(`/webhooks/${id}/logs`, { params });
    return response.data;
  },

  triggerWebhook: async (id: string, data?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.post(`/webhooks/${id}/trigger`, data);
    return response.data;
  },
};

// 智能体相关API
export const agentApi = {
  // 获取智能体列表
  getAgents: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
  }): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>>> => {
    const response = await api.get('/agents', { params });
    return response.data;
  },

  // 获取单个智能体
  getAgent: async (id: string): Promise<ApiResponse<{
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>> => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },
};

// 统计相关API
export const statsApi = {
  // 获取用户统计信息
  getUserStats: async (): Promise<ApiResponse<{
    totalProjects: number;
    totalTriggers: number;
    totalWebhooks: number;
    totalAgents: number;
    monthlyTriggers: Array<{
      month: string;
      count: number;
    }>;
  }>> => {
    const response = await api.get('/stats');
    return response.data;
  },

  // 获取项目统计信息
  getProjectStats: async (id: string): Promise<ApiResponse<{
    triggerCount: number;
    createdAt: string;
    updatedAt: string;
  }>> => {
    const response = await api.get(`/projects/${id}/stats`);
    return response.data;
  },
};

// 默认导出axios实例
export default api;