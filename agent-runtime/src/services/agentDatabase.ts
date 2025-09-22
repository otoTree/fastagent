import mongoose from 'mongoose';
import { AgentConfig } from '../types/agent';

// Agent数据库模型 - 与backend共享的模型结构
const AgentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  prompt: { type: String, required: true },
  modelName: { type: String, required: true },
  temperature: { type: Number, default: 0.7 },
  maxTokens: { type: Number, default: 1000 },
  capabilities: [{ type: String }],
  tools: [{ type: mongoose.Schema.Types.Mixed }],
  maxConcurrentTasks: { type: Number, default: 5 },
  timeout: { type: Number, default: 300000 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

// Agent数据库服务
export const agentDatabaseService = {
  // 从数据库加载agent配置
  async loadAgentConfig(agentId: string): Promise<AgentConfig | null> {
    try {
      const agentDoc = await Agent.findOne({ id: agentId, status: 'published' });
      
      if (!agentDoc) {
        return null;
      }

      // 转换为AgentConfig格式
      const config: AgentConfig = {
        id: agentDoc.id,
        name: agentDoc.name,
        description: agentDoc.description || undefined,
        prompt: agentDoc.prompt,
        modelName: agentDoc.modelName,
        temperature: agentDoc.temperature,
        maxTokens: agentDoc.maxTokens,
        capabilities: agentDoc.capabilities || [],
        tools: (agentDoc.tools || []).map((tool: any) => String(tool)),
        maxConcurrentTasks: agentDoc.maxConcurrentTasks,
        timeout: agentDoc.timeout
      };

      return config;
    } catch (error) {
      console.error(`Failed to load agent config for ${agentId}:`, error);
      return null;
    }
  },

  // 获取所有可用的agent配置
  async getAllAgentConfigs(): Promise<AgentConfig[]> {
    try {
      const agentDocs = await Agent.find({ status: 'published' });
      
      return agentDocs.map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description || undefined,
        prompt: doc.prompt,
        modelName: doc.modelName,
        temperature: doc.temperature,
        maxTokens: doc.maxTokens,
        capabilities: doc.capabilities || [],
        tools: (doc.tools || []).map((tool: any) => String(tool)),
        maxConcurrentTasks: doc.maxConcurrentTasks,
        timeout: doc.timeout
      }));
    } catch (error) {
      console.error('Failed to load all agent configs:', error);
      return [];
    }
  },

  // 检查agent是否存在
  async agentExists(agentId: string): Promise<boolean> {
    try {
      const count = await Agent.countDocuments({ id: agentId, status: 'published' });
      return count > 0;
    } catch (error) {
      console.error(`Failed to check agent existence for ${agentId}:`, error);
      return false;
    }
  },

  // 监听agent配置变化
  watchAgentChanges(callback: (agentId: string, change: 'created' | 'updated' | 'deleted') => void) {
    // 使用MongoDB Change Streams监听变化
    const changeStream = Agent.watch([
      { $match: { 'fullDocument.status': 'published' } }
    ]);

    changeStream.on('change', (change) => {
      const agentId = change.fullDocument?.id;
      if (agentId) {
        switch (change.operationType) {
          case 'insert':
            callback(agentId, 'created');
            break;
          case 'update':
          case 'replace':
            callback(agentId, 'updated');
            break;
          case 'delete':
            callback(agentId, 'deleted');
            break;
        }
      }
    });

    return changeStream;
  }
};