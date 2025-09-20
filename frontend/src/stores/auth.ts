import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/auth';
import { User, LoginInput, CreateUserInput, AuthResponse } from '@/types';
import { toast } from 'sonner';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginInput) => Promise<boolean>;
  register: (userData: CreateUserInput) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials: LoginInput): Promise<boolean> => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.login(credentials);
          const { user, token } = response;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success('登录成功！');
          return true;
        } catch (error) {
          console.error('Login error:', error);
          toast.error('登录失败，请稍后重试');
          set({ isLoading: false });
          return false;
        }
      },

      register: async (userData: CreateUserInput): Promise<boolean> => {
        try {
          set({ isLoading: true });
          
          const response = await authApi.register(userData);
          const { user, token } = response;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success('注册成功！');
          return true;
        } catch (error) {
          console.error('Register error:', error);
          toast.error('注册失败，请稍后重试');
          set({ isLoading: false });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        try {
          set({ isLoading: true });
          
          await authApi.logout();
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          toast.success('已退出登录');
        } catch (error) {
          console.error('Logout error:', error);
          // 即使退出登录失败，也清除本地状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          toast.error('退出登录失败');
        }
      },

      getCurrentUser: async (): Promise<void> => {
        try {
          const { token } = get();
          
          if (!token) {
            set({ isAuthenticated: false });
            return;
          }
          
          set({ isLoading: true });
          
          const response = await authApi.getCurrentUser();
          const { user } = response;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Get current user error:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user: User | null) => {
        set({ 
          user,
          isAuthenticated: !!user,
        });
      },

      setToken: (token: string | null) => {
        set({ 
          token,
          isAuthenticated: !!token,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);