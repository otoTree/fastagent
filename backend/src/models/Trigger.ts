import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// 触发器类型枚举
export enum TriggerType {
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  EVENT = 'event',
  API = 'api'
}

// 触发器状态枚举
export enum TriggerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ERROR = 'error'
}

// Webhook配置的Zod schema
const WebhookConfigSchema = z.object({
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
  headers: z.record(z.string()).optional(),
  responseFormat: z.enum(['json', 'text', 'html']).default('json'),
  timeout: z.number().min(1000).max(30000).default(10000),
  retryCount: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(1000).max(60000).default(5000),
});

// 定时任务配置的Zod schema
const ScheduleConfigSchema = z.object({
  cronExpression: z.string().min(1),
  timezone: z.string().default('UTC'),
  nextRunAt: z.date().optional(),
});

// 事件配置的Zod schema
const EventConfigSchema = z.object({
  eventType: z.string().min(1),
  conditions: z.record(z.any()).optional(),
});

// API配置的Zod schema
const ApiConfigSchema = z.object({
  endpoint: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional(),
  queryParams: z.record(z.string()).optional(),
});

// 通用触发器创建Schema
export const CreateTriggerSchema = z.object({
  name: z.string().min(1, 'Trigger name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: z.nativeEnum(TriggerType),
  projectId: z.string().min(1, 'Project ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  config: z.union([
    WebhookConfigSchema,
    ScheduleConfigSchema,
    EventConfigSchema,
    ApiConfigSchema
  ]),
  isActive: z.boolean().default(true),
});

// 通用触发器更新Schema
export const UpdateTriggerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  config: z.union([
    WebhookConfigSchema.partial(),
    ScheduleConfigSchema.partial(),
    EventConfigSchema.partial(),
    ApiConfigSchema.partial()
  ]).optional(),
  isActive: z.boolean().optional(),
});

// TypeScript接口定义
export interface WebhookConfig {
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  responseFormat: 'json' | 'text' | 'html';
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

export interface ScheduleConfig {
  cronExpression: string;
  timezone: string;
  nextRunAt?: Date;
}

export interface EventConfig {
  eventType: string;
  conditions?: Record<string, any>;
}

export interface ApiConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

export type TriggerConfig = WebhookConfig | ScheduleConfig | EventConfig | ApiConfig;

// 通用触发器接口
export interface ITrigger extends Document {
  name: string;
  description?: string;
  type: TriggerType;
  projectId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  config: TriggerConfig;
  status: TriggerStatus;
  isActive: boolean;
  
  // Webhook特有字段
  webhookUrl?: string;
  apiKey?: string;
  
  // 统计字段
  triggerCount: number;
  lastTriggeredAt?: Date;
  lastError?: string;
  
  // 关联字段
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  incrementTriggerCount(): Promise<ITrigger>;
  updateLastTriggered(): Promise<ITrigger>;
  setError(error: string): Promise<ITrigger>;
  clearError(): Promise<ITrigger>;
  generateWebhookUrl(): string;
  generateApiKey(): string;
}

// Mongoose Schema定义
const triggerSchema = new Schema<ITrigger>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  type: {
    type: String,
    enum: Object.values(TriggerType),
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
  config: {
    type: Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(TriggerStatus),
    default: TriggerStatus.ACTIVE,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  webhookUrl: {
    type: String,
    sparse: true, // 只有webhook类型才有这个字段
  },
  apiKey: {
    type: String,
    sparse: true, // 只有需要API key的触发器才有这个字段
  },
  triggerCount: {
    type: Number,
    default: 0,
  },
  lastTriggeredAt: {
    type: Date,
  },
  lastError: {
    type: String,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// 索引
triggerSchema.index({ owner: 1, createdAt: -1 });
triggerSchema.index({ projectId: 1 });
triggerSchema.index({ agentId: 1 });
triggerSchema.index({ type: 1 });
triggerSchema.index({ status: 1 });
triggerSchema.index({ isActive: 1 });
triggerSchema.index({ webhookUrl: 1 }, { unique: true, sparse: true });
triggerSchema.index({ apiKey: 1 }, { unique: true, sparse: true });

// 中间件：为webhook类型的触发器生成URL和API key
triggerSchema.pre('save', function(this: ITrigger, next) {
  if (this.type === TriggerType.WEBHOOK) {
    if (!this.webhookUrl) {
      this.webhookUrl = this.generateWebhookUrl();
    }
    if (!this.apiKey) {
      this.apiKey = this.generateApiKey();
    }
  }
  next();
});

// 方法实现
triggerSchema.methods.incrementTriggerCount = function(this: ITrigger) {
  this.triggerCount += 1;
  this.lastTriggeredAt = new Date();
  return this.save();
};

triggerSchema.methods.updateLastTriggered = function(this: ITrigger) {
  this.lastTriggeredAt = new Date();
  return this.save();
};

triggerSchema.methods.setError = function(this: ITrigger, error: string) {
  this.lastError = error;
  this.status = TriggerStatus.ERROR;
  return this.save();
};

triggerSchema.methods.clearError = function(this: ITrigger) {
  this.lastError = undefined;
  if (this.isActive) {
    this.status = TriggerStatus.ACTIVE;
  } else {
    this.status = TriggerStatus.INACTIVE;
  }
  return this.save();
};

triggerSchema.methods.generateWebhookUrl = function(this: ITrigger) {
  const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:4001';
  return `${baseUrl}/api/webhooks/trigger/${this._id}`;
};

triggerSchema.methods.generateApiKey = function(this: ITrigger) {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

export const Trigger = mongoose.model<ITrigger>('Trigger', triggerSchema);