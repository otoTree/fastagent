import mongoose, { Schema, Document } from 'mongoose';
import axios from 'axios';
import { AgentConfig } from '../types/agent';
import { Task } from '../types/task';

// Backend API配置
const BACKEND_API_BASE = process.env.BACKEND_API_URL || 'http://localhost:3000/api';

// Agent数据模型（与backend保持一致）
interface BackendAgent extends Document {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  publishStatus: 'draft' | 'published' | 'archived';
  projectId: string;
  userId: string;
  config: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
    capabilities?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Project数据模型
interface BackendProject extends Document {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Trigger数据模型
interface BackendTrigger extends Document {
  _id: string;
  name: string;
  type: 'webhook' | 'schedule' | 'api' | 'event';
  status: 'active' | 'inactive' | 'error';
  agentId: string;
  projectId: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 定义Mongoose Schema
const AgentSchema = new Schema<BackendAgent>({
  name: { type: String, required: true },
  description: String,
  avatar: String,
  publishStatus: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  config: {
    systemPrompt: String,
    temperature: Number,
    maxTokens: Number,
    tools: [String],
    capabilities: [String]
  }
}, { timestamps: true });

const ProjectSchema = new Schema<BackendProject>({
  name: { type: String, required: true },
  description: String,
  userId: { type: String, required: true },
  settings: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const TriggerSchema = new Schema<BackendTrigger>({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['webhook', 'schedule', 'api', 'event'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'error'], 
    default: 'active' 
  },
  agentId: { type: String, required: true },
  projectId: { type: String, required: true },
  config: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// 创建模型
const AgentModel = mongoose.model<BackendAgent>('Agent', AgentSchema);
const ProjectModel = mongoose.model<BackendProject>('Project', ProjectSchema);
const TriggerModel = mongoose.model<BackendTrigger>('Trigger', TriggerSchema);

export class BackendSyncService {
  private static instance: BackendSyncService;

  private constructor() {}

  static getInstance(): BackendSyncService {
    if (!BackendSyncService.instance) {
      BackendSyncService.instance = new BackendSyncService();
    }
    return BackendSyncService.instance;
  }

  // 从backend API获取Agent数据
  async fetchAgentFromAPI(agentId: string): Promise<AgentConfig | null> {
    try {
      const response = await axios.get(`${BACKEND_API_BASE}/agents/${agentId}`);
      const backendAgent = response.data;

      // 转换为runtime格式
      return this.convertBackendAgentToConfig(backendAgent);
    } catch (error) {
      console.error(`Failed to fetch agent ${agentId} from API:`, error);
      return null;
    }
  }

  // 从数据库获取Agent数据
  async fetchAgentFromDB(agentId: string): Promise<AgentConfig | null> {
    try {
      const agent = await AgentModel.findById(agentId).lean();
      if (!agent) return null;

      return this.convertBackendAgentToConfig(agent);
    } catch (error) {
      console.error(`Failed to fetch agent ${agentId} from DB:`, error);
      return null;
    }
  }

  // 获取所有活跃的Agent
  async getAllActiveAgents(): Promise<AgentConfig[]> {
    try {
      const agents = await AgentModel.find({ 
        publishStatus: 'published' 
      }).lean();

      return agents.map(agent => this.convertBackendAgentToConfig(agent));
    } catch (error) {
      console.error('Failed to fetch active agents:', error);
      return [];
    }
  }

  // 获取项目信息
  async getProject(projectId: string): Promise<BackendProject | null> {
    try {
      return await ProjectModel.findById(projectId).lean();
    } catch (error) {
      console.error(`Failed to fetch project ${projectId}:`, error);
      return null;
    }
  }

  // 获取Agent的触发器
  async getAgentTriggers(agentId: string): Promise<BackendTrigger[]> {
    try {
      return await TriggerModel.find({ 
        agentId, 
        status: 'active' 
      }).lean();
    } catch (error) {
      console.error(`Failed to fetch triggers for agent ${agentId}:`, error);
      return [];
    }
  }

  // 同步Agent状态到backend
  async syncAgentStatus(agentId: string, status: any): Promise<void> {
    try {
      // 可以通过API或直接数据库更新
      await axios.put(`${BACKEND_API_BASE}/agents/${agentId}/status`, status);
    } catch (error) {
      console.error(`Failed to sync agent ${agentId} status:`, error);
    }
  }

  // 记录任务执行结果
  async recordTaskExecution(task: Task, result: any): Promise<void> {
    try {
      const executionRecord = {
        taskId: task.id,
        agentId: task.input.context.agentId,
        projectId: task.input.context.projectId,
        status: task.result?.status || 'unknown',
        result,
        executedAt: new Date()
      };

      await axios.post(`${BACKEND_API_BASE}/executions`, executionRecord);
    } catch (error) {
      console.error('Failed to record task execution:', error);
    }
  }

  // 转换backend Agent数据为runtime配置
  private convertBackendAgentToConfig(backendAgent: any): AgentConfig {
    return {
      id: backendAgent._id.toString(),
      name: backendAgent.name,
      description: backendAgent.description || '',
      prompt: backendAgent.config?.systemPrompt || '',
      modelName: backendAgent.config?.modelName || 'gpt-3.5-turbo',
      temperature: backendAgent.config?.temperature || 0.7,
      maxTokens: backendAgent.config?.maxTokens || 2000,
      capabilities: backendAgent.config?.capabilities || [],
      tools: backendAgent.config?.tools || [],
      maxConcurrentTasks: 5,
      timeout: 300000
    };
  }

  // 监听backend数据变化（通过webhook或轮询）
  async startSyncMonitoring(callback: (event: any) => void): Promise<void> {
    // 这里可以实现webhook监听或定时轮询
    console.log('Backend sync monitoring started');
    
    // 示例：定时同步
    setInterval(async () => {
      try {
        const agents = await this.getAllActiveAgents();
        callback({
          type: 'agents_updated',
          data: agents
        });
      } catch (error) {
        console.error('Sync monitoring error:', error);
      }
    }, 30000); // 每30秒同步一次
  }
}

export const backendSyncService = BackendSyncService.getInstance();