import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WebhookTrigger, CreateWebhookTriggerInput, UpdateWebhookTriggerInput } from '@/types';
import { webhookApi } from '@/services/api';

interface WebhookState {
  // 状态
  webhooks: WebhookTrigger[];
  currentWebhook: WebhookTrigger | null;
  loading: boolean;
  error: string | null;
  
  // 分页状态
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // 搜索和过滤
  searchQuery: string;
  selectedAgentId: string | null;

  // Webhook执行日志
  webhookLogs: Array<{
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
  }>;
  logsLoading: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  setPagination: (pagination: Partial<WebhookState['pagination']>) => void;
  setLogsLoading: (loading: boolean) => void;

  // API Actions
  fetchWebhooks: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    agentId?: string;
  }) => Promise<void>;
  
  fetchWebhook: (id: string) => Promise<void>;
  createWebhook: (data: CreateWebhookTriggerInput & { projectId: string }) => Promise<WebhookTrigger>;
  updateWebhook: (id: string, data: UpdateWebhookTriggerInput) => Promise<WebhookTrigger>;
  deleteWebhook: (id: string) => Promise<void>;
  regenerateApiKey: (id: string) => Promise<string>;
  
  // Webhook执行相关
  fetchWebhookLogs: (id: string, params?: { page?: number; limit?: number }) => Promise<void>;
  triggerWebhook: (id: string, data?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  
  // 本地状态更新
  addWebhook: (webhook: WebhookTrigger) => void;
  updateWebhookInList: (id: string, updates: Partial<WebhookTrigger>) => void;
  removeWebhook: (id: string) => void;
  setCurrentWebhook: (webhook: WebhookTrigger | null) => void;
  
  // 重置状态
  reset: () => void;
}

const initialState = {
  webhooks: [],
  currentWebhook: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  searchQuery: '',
  selectedAgentId: null,
  webhookLogs: [],
  logsLoading: false,
};

export const useWebhookStore = create<WebhookState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 基础状态设置
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
      setPagination: (pagination) => 
        set((state) => ({ 
          pagination: { ...state.pagination, ...pagination } 
        })),
      setLogsLoading: (logsLoading) => set({ logsLoading }),

      // API Actions
      fetchWebhooks: async (params) => {
        set({ loading: true, error: null });
        try {
          const response = await webhookApi.getAll(params);
          if (response.success && response.data) {
            set({ 
              webhooks: response.data,
              loading: false,
              pagination: {
                page: params?.page || 1,
                limit: params?.limit || 10,
                total: response.meta?.total || 0,
                totalPages: response.meta?.totalPages || Math.ceil((response.meta?.total || 0) / (params?.limit || 10)),
              }
            });
          } else {
            set({ 
              error: response.error?.message || '获取Webhook列表失败',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取Webhook列表失败',
            loading: false 
          });
        }
      },

      fetchWebhook: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await webhookApi.getById(id);
          if (response.success && response.data) {
            set({ 
              currentWebhook: response.data,
              loading: false 
            });
          } else {
            set({ 
              error: response.error?.message || '获取Webhook详情失败',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取Webhook详情失败',
            loading: false 
          });
        }
      },

      createWebhook: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await webhookApi.create(data);
          if (response.success && response.data) {
            const newWebhook = response.data;
            set((state) => ({ 
              webhooks: [newWebhook, ...state.webhooks],
              loading: false 
            }));
            return newWebhook;
          } else {
            const error = response.error?.message || '创建Webhook失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '创建Webhook失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      updateWebhook: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const response = await webhookApi.update(id, data);
          if (response.success && response.data) {
            const updatedWebhook = response.data;
            set((state) => ({
              webhooks: state.webhooks.map(w => 
                w._id === id ? updatedWebhook : w
              ),
              currentWebhook: state.currentWebhook?._id === id 
                ? updatedWebhook 
                : state.currentWebhook,
              loading: false
            }));
            return updatedWebhook;
          } else {
            const error = response.error?.message || '更新Webhook失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '更新Webhook失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      deleteWebhook: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await webhookApi.delete(id);
          if (response.success) {
            set((state) => ({
              webhooks: state.webhooks.filter(w => w._id !== id),
              currentWebhook: state.currentWebhook?._id === id 
                ? null 
                : state.currentWebhook,
              loading: false
            }));
          } else {
            const error = response.error?.message || '删除Webhook失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '删除Webhook失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      regenerateApiKey: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await webhookApi.regenerateApiKey(id);
          if (response.success && response.data) {
            const newApiKey = response.data.apiKey;
            // 更新当前webhook的API密钥
            set((state) => ({
              webhooks: state.webhooks.map(w => 
                w._id === id ? { ...w, apiKey: newApiKey } : w
              ),
              currentWebhook: state.currentWebhook?._id === id 
                ? { ...state.currentWebhook, apiKey: newApiKey }
                : state.currentWebhook,
              loading: false
            }));
            return newApiKey;
          } else {
            const error = response.error?.message || '重新生成API密钥失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '重新生成API密钥失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      fetchWebhookLogs: async (id, params) => {
        set({ logsLoading: true, error: null });
        try {
          const response = await webhookApi.getWebhookLogs(id, params);
          if (response.success && response.data) {
            set({ 
              webhookLogs: response.data,
              logsLoading: false 
            });
          } else {
            set({ 
              error: response.error?.message || '获取Webhook日志失败',
              logsLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取Webhook日志失败',
            logsLoading: false 
          });
        }
      },

      triggerWebhook: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const response = await webhookApi.triggerWebhook(id, data);
          if (response.success && response.data) {
            set({ loading: false });
            return response.data;
          } else {
            const error = response.error?.message || '触发Webhook失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '触发Webhook失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // 本地状态更新
      addWebhook: (webhook) => 
        set((state) => ({ 
          webhooks: [webhook, ...state.webhooks] 
        })),

      updateWebhookInList: (id, updates) =>
        set((state) => ({
          webhooks: state.webhooks.map(w => 
            w._id === id ? { ...w, ...updates } : w
          ),
          currentWebhook: state.currentWebhook?._id === id 
            ? { ...state.currentWebhook, ...updates }
            : state.currentWebhook
        })),

      removeWebhook: (id) =>
        set((state) => ({
          webhooks: state.webhooks.filter(w => w._id !== id),
          currentWebhook: state.currentWebhook?._id === id 
            ? null 
            : state.currentWebhook
        })),

      setCurrentWebhook: (webhook) => set({ currentWebhook: webhook }),

      // 重置状态
      reset: () => set(initialState),
    }),
    {
      name: 'webhook-store',
    }
  )
);