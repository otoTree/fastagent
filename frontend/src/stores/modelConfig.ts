import { create } from 'zustand';
import { toast } from 'sonner';
import { modelConfigApi } from '@/lib/api';
import { 
  ModelConfig, 
  CreateModelConfigFormData, 
  UpdateModelConfigFormData,
  ModelConfigsResponse,
  ModelConfigResponse
} from '@/types/modelConfig';

interface ModelConfigState {
  modelConfigs: ModelConfig[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchModelConfigs: () => Promise<void>;
  createModelConfig: (data: CreateModelConfigFormData) => Promise<ModelConfig>;
  updateModelConfig: (id: string, data: UpdateModelConfigFormData) => Promise<ModelConfig>;
  deleteModelConfig: (id: string) => Promise<void>;
  setDefaultModelConfig: (id: string) => Promise<void>;
  toggleModelConfigActive: (id: string) => Promise<void>;
  testModelConfigConnection: (id: string) => Promise<boolean>;
}

export const useModelConfigStore = create<ModelConfigState>((set, get) => ({
  modelConfigs: [],
  loading: false,
  error: null,

  // 获取所有模型配置
  fetchModelConfigs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await modelConfigApi.getAll();
      const data = response.data as ModelConfigsResponse;
      if (data.success) {
        set({ 
          modelConfigs: data.data.configs,
          loading: false 
        });
      } else {
        throw new Error('获取模型配置失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取模型配置失败';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // 创建模型配置
  createModelConfig: async (data: CreateModelConfigFormData) => {
    set({ loading: true, error: null });
    try {
      const response = await modelConfigApi.create(data);
      const result = response.data as ModelConfigResponse;
      if (result.success) {
        set(state => ({
          modelConfigs: [...state.modelConfigs, result.data],
          loading: false
        }));
        toast.success('模型配置创建成功');
        return result.data;
      } else {
        throw new Error('创建模型配置失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建模型配置失败';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // 更新模型配置
  updateModelConfig: async (id: string, data: UpdateModelConfigFormData) => {
    set({ loading: true, error: null });
    try {
      const response = await modelConfigApi.update(id, data);
      const result = response.data as ModelConfigResponse;
      if (result.success) {
        set(state => ({
          modelConfigs: state.modelConfigs.map(config => 
            config._id === id ? result.data : config
          ),
          loading: false
        }));
        toast.success('模型配置更新成功');
        return result.data;
      } else {
        throw new Error('更新模型配置失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新模型配置失败';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // 删除模型配置
  deleteModelConfig: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await modelConfigApi.delete(id);
      set(state => ({
        modelConfigs: state.modelConfigs.filter(config => config._id !== id),
        loading: false
      }));
      toast.success('模型配置删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除模型配置失败';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // 设置默认模型配置
  setDefaultModelConfig: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await modelConfigApi.setDefault(id);
      const result = response.data as ModelConfigResponse;
      if (result.success) {
        set(state => ({
          modelConfigs: state.modelConfigs.map(config => ({
            ...config,
            isDefault: config._id === id
          })),
          loading: false
        }));
        toast.success('默认模型配置设置成功');
      } else {
        throw new Error('设置默认模型配置失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '设置默认模型配置失败';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // 切换模型配置激活状态
  toggleModelConfigActive: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await modelConfigApi.toggleActive(id);
      const result = response.data as ModelConfigResponse;
      if (result.success) {
        set(state => ({
          modelConfigs: state.modelConfigs.map(config => 
            config._id === id ? result.data : config
          ),
          loading: false
        }));
        toast.success('模型配置状态更新成功');
      } else {
        throw new Error('更新模型配置状态失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新模型配置状态失败';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  // 测试模型配置连接
  testModelConfigConnection: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await modelConfigApi.testConnection(id);
      if (response.data.success) {
        toast.success('连接测试成功');
        set({ loading: false });
        return true;
      } else {
        throw new Error('连接测试失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接测试失败';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return false;
    }
  }
}));