import api from './api';
import { LoginInput, CreateUserInput, AuthResponse, ApiResponse } from '@/types';

export const authApi = {
  // 用户注册
  register: async (userData: CreateUserInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    return response.data.data!;
  },

  // 用户登录
  login: async (credentials: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await api.get<ApiResponse<AuthResponse>>('/auth/me');
    return response.data.data!;
  },

  // 用户登出
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// 本地存储工具函数
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  },
};

export const userStorage = {
  get: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  set: (user: unknown): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  },
};