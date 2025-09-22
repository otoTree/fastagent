import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { triggerApi } from '@/services/api';
import { Trigger, CreateTriggerInput, UpdateTriggerInput } from '@/types';

interface TriggerState {
  triggers: Trigger[];
  currentTrigger: Trigger | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTriggers: (projectId: string) => Promise<void>;
  fetchTrigger: (id: string) => Promise<void>;
  createTrigger: (input: CreateTriggerInput) => Promise<void>;
  updateTrigger: (id: string, input: UpdateTriggerInput) => Promise<void>;
  deleteTrigger: (id: string) => Promise<void>;
  toggleTrigger: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentTrigger: (trigger: Trigger | null) => void;
}

export const useTriggerStore = create<TriggerState>()(
  devtools(
    (set, get) => ({
      triggers: [],
      currentTrigger: null,
      isLoading: false,
      error: null,

      fetchTriggers: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await triggerApi.getTriggers({ projectId });
          if (response.success) {
            set({ triggers: response.data, isLoading: false });
          } else {
            set({ error: response.error?.message || '获取触发器列表失败', isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || '获取触发器列表失败', isLoading: false });
        }
      },

      fetchTrigger: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await triggerApi.getTrigger(id);
          if (response.success) {
            set({ currentTrigger: response.data, isLoading: false });
          } else {
            set({ error: response.error?.message || '获取触发器失败', isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || '获取触发器失败', isLoading: false });
        }
      },

      createTrigger: async (input: CreateTriggerInput) => {
        set({ isLoading: true, error: null });
        try {
          const response = await triggerApi.createTrigger(input);
          if (response.success) {
            const { triggers } = get();
            set({ 
              triggers: [...triggers, response.data], 
              isLoading: false 
            });
          } else {
            set({ error: response.error?.message || '创建触发器失败', isLoading: false });
            throw new Error(response.error?.message || '创建触发器失败');
          }
        } catch (error: any) {
          set({ error: error.message || '创建触发器失败', isLoading: false });
          throw error;
        }
      },

      updateTrigger: async (id: string, input: UpdateTriggerInput) => {
        set({ isLoading: true, error: null });
        try {
          const response = await triggerApi.updateTrigger(id, input);
          if (response.success) {
            const { triggers } = get();
            const updatedTriggers = triggers.map(trigger => 
              trigger._id === id ? response.data : trigger
            );
            set({ 
              triggers: updatedTriggers, 
              currentTrigger: response.data,
              isLoading: false 
            });
          } else {
            set({ error: response.error?.message || '更新触发器失败', isLoading: false });
            throw new Error(response.error?.message || '更新触发器失败');
          }
        } catch (error: any) {
          set({ error: error.message || '更新触发器失败', isLoading: false });
          throw error;
        }
      },

      deleteTrigger: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await triggerApi.deleteTrigger(id);
          if (response.success) {
            const { triggers } = get();
            const filteredTriggers = triggers.filter(trigger => trigger._id !== id);
            set({ 
              triggers: filteredTriggers, 
              isLoading: false 
            });
          } else {
            set({ error: response.error?.message || '删除触发器失败', isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || '删除触发器失败', isLoading: false });
        }
      },

      toggleTrigger: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await triggerApi.toggleTrigger(id);
          if (response.success) {
            const { triggers } = get();
            const updatedTriggers = triggers.map(trigger => 
              trigger._id === id ? response.data : trigger
            );
            set({ 
              triggers: updatedTriggers, 
              currentTrigger: response.data,
              isLoading: false 
            });
          } else {
            set({ error: response.error?.message || '切换触发器状态失败', isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message || '切换触发器状态失败', isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      
      setCurrentTrigger: (trigger: Trigger | null) => set({ currentTrigger: trigger }),
    }),
    {
      name: 'trigger-store',
    }
  )
);