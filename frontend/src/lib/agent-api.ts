import axios from 'axios';
import { Agent, AgentsResponse } from '@/types/agent';

// 后端API基础URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 创建API实例
const agentApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
agentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
agentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Agent API Error:', error);
    return Promise.reject(error);
  }
);

// 获取已发布的智能体列表（用于引用）
export const getPublishedAgents = async (): Promise<Agent[]> => {
  try {
    const response = await agentApi.get<AgentsResponse>('/agents/public', {
      params: {
        limit: 100 // 获取更多数据用于自动补全
      }
    });
    return response.data.data.agents;
  } catch (error) {
    console.error('Failed to fetch published agents:', error);
    return [];
  }
};

// 搜索智能体（用于自动补全）
export const searchAgents = async (query: string): Promise<Agent[]> => {
  try {
    const response = await agentApi.get<AgentsResponse>('/agents/public', {
      params: {
        search: query,
        limit: 50
      }
    });
    return response.data.data.agents;
  } catch (error) {
    console.error('Failed to search agents:', error);
    return [];
  }
};

// 获取智能体详情
export const getAgentDetail = async (agentId: string): Promise<Agent | null> => {
  try {
    const response = await agentApi.get<{ success: boolean; data: Agent }>(`/agents/${agentId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch agent detail:', error);
    return null;
  }
};

export default agentApi;