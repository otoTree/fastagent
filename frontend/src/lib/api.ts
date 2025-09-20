import axios from 'axios';

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
  publish: (id: string) => api.post(`/agents/${id}/publish`),
  
  // Unpublish agent
  unpublish: (id: string) => api.post(`/agents/${id}/unpublish`),
  
  // Archive agent
  archive: (id: string) => api.post(`/agents/${id}/archive`),
  
  // Get public agents for discovery
  getPublicAgents: (params?: { page?: number; limit?: number; search?: string; tags?: string[] }) => 
    api.get('/agents/public/discover', { params }),
};

export default api;