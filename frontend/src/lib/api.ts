import axios from 'axios';
import { CreateModelConfigFormData, UpdateModelConfigFormData } from '@/types/modelConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (Zustand persist storage)
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
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Agent API methods
export const agentApi = {
  // Publish agent
  publish: (id: string) => api.post(`/agents/${id}/publish`, { publishStatus: 'published' }),
  
  // Unpublish agent
  unpublish: (id: string) => api.post(`/agents/${id}/unpublish`, { publishStatus: 'draft' }),
  
  // Archive agent
  archive: (id: string) => api.post(`/agents/${id}/archive`, { publishStatus: 'archived' }),
  
  // Get public agents for discovery
  getPublicAgents: (params?: { page?: number; limit?: number; search?: string; tags?: string[] }) => 
    api.get('/agents/public', { params }),
};

// Model Config API methods
export const modelConfigApi = {
  // Get all model configs
  getAll: () => api.get('/model-configs'),
  
  // Get model config by id
  getById: (id: string) => api.get(`/model-configs/${id}`),
  
  // Create new model config
  create: (data: CreateModelConfigFormData) => api.post('/model-configs', data),
  
  // Update model config
  update: (id: string, data: UpdateModelConfigFormData) => api.put(`/model-configs/${id}`, data),
  
  // Delete model config
  delete: (id: string) => api.delete(`/model-configs/${id}`),
  
  // Set default model config
  setDefault: (id: string) => api.patch(`/model-configs/${id}/default`),
  
  // Toggle active status
  toggleActive: (id: string) => api.patch(`/model-configs/${id}/toggle-active`),
  
  // Test connection
  testConnection: (id: string) => api.post(`/model-configs/${id}/test`),
};

export default api;