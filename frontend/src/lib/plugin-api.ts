import axios from 'axios';
import { ToolListItem, ToolType } from '@/types/plugin';

// FastGPT Plugin API 基础 URL
const PLUGIN_API_URL = process.env.NEXT_PUBLIC_PLUGIN_API_URL || 'http://localhost:3030';

// 创建插件 API 实例
const pluginApi = axios.create({
  baseURL: PLUGIN_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证 token
pluginApi.interceptors.request.use(
  (config) => {
    // 使用固定的 token 进行开发测试
    config.headers.authtoken = 'xxx';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
pluginApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Plugin API Error:', error);
    return Promise.reject(error);
  }
);

// 获取插件列表
export const getPluginList = async (): Promise<ToolListItem[]> => {
  try {
    const response = await pluginApi.get('/tool/list');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch plugin list:', error);
    throw error;
  }
};

// 获取单个插件详情
export const getPluginDetail = async (toolId: string): Promise<ToolListItem> => {
  try {
    const response = await pluginApi.get('/tool/get', {
      params: { toolId }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch plugin detail:', error);
    throw error;
  }
};

// 获取插件类型列表
export const getPluginTypes = async (): Promise<ToolType[]> => {
  try {
    const response = await pluginApi.get('/tool/getType');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch plugin types:', error);
    throw error;
  }
};

export default pluginApi;