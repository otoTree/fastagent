import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// 触发器调用状态枚举
export enum TriggerLogStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  ERROR = 'error'
}

// 触发器调用日志的Zod schema
export const CreateTriggerLogSchema = z.object({
  triggerId: z.string().min(1, 'Trigger ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  status: z.nativeEnum(TriggerLogStatus),
  requestData: z.record(z.any()).optional(),
  responseData: z.record(z.any()).optional(),
  errorMessage: z.string().optional(),
  executionTime: z.number().min(0),
  httpMethod: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

// TypeScript接口定义
export interface ITriggerLog extends Document {
  triggerId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  
  // 调用信息
  status: TriggerLogStatus;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
  errorMessage?: string;
  executionTime: number; // 执行时间（毫秒）
  
  // HTTP相关信息
  httpMethod?: string;
  userAgent?: string;
  ipAddress?: string;
  headers?: Record<string, string>;
  
  // 时间戳
  triggeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema定义
const triggerLogSchema = new Schema<ITriggerLog>({
  triggerId: {
    type: Schema.Types.ObjectId,
    ref: 'Trigger',
    required: true,
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(TriggerLogStatus),
    required: true,
  },
  requestData: {
    type: Schema.Types.Mixed,
  },
  responseData: {
    type: Schema.Types.Mixed,
  },
  errorMessage: {
    type: String,
  },
  executionTime: {
    type: Number,
    required: true,
    min: 0,
  },
  httpMethod: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  headers: {
    type: Schema.Types.Mixed,
  },
  triggeredAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// 索引优化
triggerLogSchema.index({ owner: 1, triggeredAt: -1 }); // 按用户和时间查询
triggerLogSchema.index({ triggerId: 1, triggeredAt: -1 }); // 按触发器查询
triggerLogSchema.index({ projectId: 1, triggeredAt: -1 }); // 按项目查询
triggerLogSchema.index({ agentId: 1, triggeredAt: -1 }); // 按代理查询
triggerLogSchema.index({ status: 1 }); // 按状态查询
triggerLogSchema.index({ triggeredAt: -1 }); // 时间排序

// 设置TTL索引，自动删除30天前的日志
triggerLogSchema.index({ triggeredAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const TriggerLog = mongoose.model<ITriggerLog>('TriggerLog', triggerLogSchema);