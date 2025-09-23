import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { User, LoginInput, CreateUserInput } from '@/types';
import { toast } from 'sonner';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  
  // Actions
  login: (credentials: LoginInput) => Promise<boolean>;
  register: (userData: CreateUserInput) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
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
      isHydrated: false, // 统一初始化为 false，避免 SSR/CSR 不匹配

      // Actions
      login: async (credentials: LoginInput): Promise<boolean> => {
        try {
          set({ isLoading: true });
          
          const response = await api.post('/auth/login', credentials);
          const { user, token } = response.data.data;
          
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
          
          const response = await api.post('/auth/register', userData);
          const { user, token } = response.data.data;
          
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
          
          await api.post('/auth/logout');
          
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
          
          const response = await api.get('/auth/me');
          const { user } = response.data.data;
          
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

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
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
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          // 立即设置 hydrated 状态，避免延迟导致的闪烁
          state.setHydrated(true);
        }
      },
    }
  )
);