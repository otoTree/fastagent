import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// 发布状态枚举
export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Zod validation schemas
export const CreateAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Agent name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  prompt: z.string().min(1, 'System prompt is required'),
  modelName: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4096).default(1000),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  publishStatus: z.nativeEnum(PublishStatus).default(PublishStatus.DRAFT),
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  prompt: z.string().min(1).optional(),
  modelName: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  publishStatus: z.nativeEnum(PublishStatus).optional(),
});

// 发布操作的验证schema
export const PublishAgentSchema = z.object({
  publishStatus: z.nativeEnum(PublishStatus),
});

// TypeScript interface
export interface IAgent extends Document {
  name: string;
  description?: string;
  avatar?: string;
  prompt: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  tags: string[];
  capabilities: string[];
  publishStatus: PublishStatus;
  publishedAt?: Date;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsedAt?: Date;
  
  // Methods
  incrementUsage(): Promise<IAgent>;
  publish(): Promise<IAgent>;
  unpublish(): Promise<IAgent>;
  archive(): Promise<IAgent>;
}

// Mongoose schema
const agentSchema = new Schema<IAgent>({
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
  avatar: {
    type: String,
    default: null,
  },
  prompt: {
    type: String,
    required: true,
  },
  modelName: {
    type: String,
    required: true,
    default: 'gpt-3.5-turbo',
  },
  temperature: {
    type: Number,
    min: 0,
    max: 2,
    default: 0.7,
  },
  maxTokens: {
    type: Number,
    min: 1,
    max: 4096,
    default: 1000,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  capabilities: [{
    type: String,
    trim: true,
  }],
  publishStatus: {
    type: String,
    enum: Object.values(PublishStatus),
    default: PublishStatus.DRAFT,
  },
  publishedAt: {
    type: Date,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
agentSchema.index({ owner: 1, createdAt: -1 });
agentSchema.index({ isPublic: 1, createdAt: -1 });
agentSchema.index({ publishStatus: 1, publishedAt: -1 });
agentSchema.index({ tags: 1 });
agentSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted creation date
agentSchema.virtual('formattedCreatedAt').get(function(this: IAgent) {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted published date
agentSchema.virtual('formattedPublishedAt').get(function(this: IAgent) {
  return this.publishedAt?.toLocaleDateString();
});

// Method to increment usage count
agentSchema.methods.incrementUsage = function(this: IAgent) {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// Method to publish agent
agentSchema.methods.publish = function(this: IAgent) {
  this.publishStatus = PublishStatus.PUBLISHED;
  this.publishedAt = new Date();
  this.isPublic = true;
  return this.save();
};

// Method to unpublish agent
agentSchema.methods.unpublish = function(this: IAgent) {
  this.publishStatus = PublishStatus.DRAFT;
  this.publishedAt = undefined;
  this.isPublic = false;
  return this.save();
};

// Method to archive agent
agentSchema.methods.archive = function(this: IAgent) {
  this.publishStatus = PublishStatus.ARCHIVED;
  this.isPublic = false;
  return this.save();
};

export const Agent = mongoose.model<IAgent>('Agent', agentSchema);