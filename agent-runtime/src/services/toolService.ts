import axios from 'axios';
import { z } from 'zod';

// FastGPT Plugin API配置
const PLUGIN_API_BASE = process.env.PLUGIN_API_URL || 'http://localhost:3002/api';

// 工具调用请求
export const ToolCallRequestSchema = z.object({
  toolId: z.string(),
  toolName: z.string(),
  input: z.record(z.any()),
  timeout: z.number().default(30000),
  metadata: z.record(z.any()).optional()
});

// 工具调用响应
export const ToolCallResponseSchema = z.object({
  success: z.boolean(),
  output: z.record(z.any()).optional(),
  error: z.string().optional(),
  duration: z.number(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

// 工具信息
export const ToolInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  category: z.string(),
  inputSchema: z.record(z.any()),
  outputSchema: z.record(z.any()),
  config: z.record(z.any()).optional(),
  enabled: z.boolean().default(true)
});

export type ToolCallRequest = z.infer<typeof ToolCallRequestSchema>;
export type ToolCallResponse = z.infer<typeof ToolCallResponseSchema>;
export type ToolInfo = z.infer<typeof ToolInfoSchema>;

export class ToolService {
  private static instance: ToolService;
  private toolsCache: Map<string, ToolInfo> = new Map();
  private lastCacheUpdate: Date | null = null;
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  private constructor() {}

  static getInstance(): ToolService {
    if (!ToolService.instance) {
      ToolService.instance = new ToolService();
    }
    return ToolService.instance;
  }

  // 获取所有可用工具
  async getAvailableTools(forceRefresh = false): Promise<ToolInfo[]> {
    try {
      // 检查缓存
      if (!forceRefresh && this.isCacheValid()) {
        return Array.from(this.toolsCache.values());
      }

      const response = await axios.get(`${PLUGIN_API_BASE}/tools/list`);
      const tools = response.data.data || response.data;

      // 更新缓存
      this.toolsCache.clear();
      tools.forEach((tool: any) => {
        const toolInfo = this.normalizeToolInfo(tool);
        this.toolsCache.set(toolInfo.id, toolInfo);
      });

      this.lastCacheUpdate = new Date();
      return Array.from(this.toolsCache.values());
    } catch (error) {
      console.error('Failed to fetch available tools:', error);
      return Array.from(this.toolsCache.values()); // 返回缓存的工具
    }
  }

  // 获取单个工具信息
  async getTool(toolId: string): Promise<ToolInfo | null> {
    try {
      // 先检查缓存
      if (this.toolsCache.has(toolId) && this.isCacheValid()) {
        return this.toolsCache.get(toolId)!;
      }

      const response = await axios.get(`${PLUGIN_API_BASE}/tools/${toolId}`);
      const toolData = response.data.data || response.data;
      
      const toolInfo = this.normalizeToolInfo(toolData);
      this.toolsCache.set(toolId, toolInfo);
      
      return toolInfo;
    } catch (error) {
      console.error(`Failed to fetch tool ${toolId}:`, error);
      return this.toolsCache.get(toolId) || null;
    }
  }

  // 调用工具
  async callTool(request: ToolCallRequest): Promise<ToolCallResponse> {
    const startTime = Date.now();
    
    try {
      // 验证请求
      const validatedRequest = ToolCallRequestSchema.parse(request);
      
      // 获取工具信息
      const toolInfo = await this.getTool(validatedRequest.toolId);
      if (!toolInfo) {
        throw new Error(`Tool ${validatedRequest.toolId} not found`);
      }

      if (!toolInfo.enabled) {
        throw new Error(`Tool ${validatedRequest.toolId} is disabled`);
      }

      // 调用工具API
      const response = await axios.post(
        `${PLUGIN_API_BASE}/tools/${validatedRequest.toolId}/execute`,
        {
          input: validatedRequest.input,
          metadata: validatedRequest.metadata
        },
        {
          timeout: validatedRequest.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        output: response.data.data || response.data.output || response.data,
        duration,
        timestamp: new Date(),
        metadata: {
          toolName: toolInfo.name,
          toolVersion: toolInfo.version,
          ...validatedRequest.metadata
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message || 'Tool execution failed',
        duration,
        timestamp: new Date(),
        metadata: {
          toolId: request.toolId,
          ...request.metadata
        }
      };
    }
  }

  // 批量调用工具
  async callToolsBatch(requests: ToolCallRequest[]): Promise<ToolCallResponse[]> {
    const promises = requests.map(request => this.callTool(request));
    return Promise.all(promises);
  }

  // 获取工具类型列表
  async getToolTypes(): Promise<string[]> {
    try {
      const response = await axios.get(`${PLUGIN_API_BASE}/tools/types`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch tool types:', error);
      return [];
    }
  }

  // 按类型获取工具
  async getToolsByType(type: string): Promise<ToolInfo[]> {
    const allTools = await this.getAvailableTools();
    return allTools.filter(tool => tool.category === type);
  }

  // 搜索工具
  async searchTools(query: string): Promise<ToolInfo[]> {
    const allTools = await this.getAvailableTools();
    const lowerQuery = query.toLowerCase();
    
    return allTools.filter(tool => 
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.category.toLowerCase().includes(lowerQuery)
    );
  }

  // 验证工具输入
  async validateToolInput(toolId: string, input: any): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const toolInfo = await this.getTool(toolId);
      if (!toolInfo) {
        return { valid: false, errors: ['Tool not found'] };
      }

      // 这里可以根据工具的inputSchema进行验证
      // 简化实现，实际应该使用JSON Schema验证
      return { valid: true };
    } catch (error) {
      return { valid: false, errors: [(error as Error).message] };
    }
  }

  // 获取工具使用统计
  async getToolStats(toolId?: string): Promise<any> {
    try {
      const endpoint = toolId 
        ? `${PLUGIN_API_BASE}/tools/${toolId}/stats`
        : `${PLUGIN_API_BASE}/tools/stats`;
        
      const response = await axios.get(endpoint);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch tool stats:', error);
      return null;
    }
  }

  // 私有方法：检查缓存是否有效
  private isCacheValid(): boolean {
    if (!this.lastCacheUpdate) return false;
    return Date.now() - this.lastCacheUpdate.getTime() < this.cacheTimeout;
  }

  // 私有方法：标准化工具信息
  private normalizeToolInfo(toolData: any): ToolInfo {
    return {
      id: toolData.id || toolData._id,
      name: toolData.name,
      description: toolData.description || '',
      version: toolData.version || '1.0.0',
      category: toolData.category || toolData.type || 'general',
      inputSchema: toolData.inputSchema || toolData.input_schema || {},
      outputSchema: toolData.outputSchema || toolData.output_schema || {},
      config: toolData.config || {},
      enabled: toolData.enabled !== false
    };
  }

  // 清除缓存
  clearCache(): void {
    this.toolsCache.clear();
    this.lastCacheUpdate = null;
  }

  // 健康检查
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const response = await axios.get(`${PLUGIN_API_BASE}/health`, {
        timeout: 5000
      });
      
      return {
        healthy: true,
        details: {
          status: response.status,
          data: response.data,
          cacheSize: this.toolsCache.size,
          lastCacheUpdate: this.lastCacheUpdate
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: (error as Error).message,
          cacheSize: this.toolsCache.size,
          lastCacheUpdate: this.lastCacheUpdate
        }
      };
    }
  }
}

export const toolService = ToolService.getInstance();