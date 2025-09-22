import mongoose, { Schema, Document } from 'mongoose';

export interface IModelConfig extends Document {
  _id: string;
  name: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  modelType: 'chat' | 'completion' | 'embedding';
  apiEndpoint?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  isActive: boolean;
  isDefault: boolean;
  description?: string;
  capabilities: string[];
  pricing?: {
    inputTokenPrice: number;  // per 1K tokens
    outputTokenPrice: number; // per 1K tokens
    currency: string;
  };
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ModelConfigSchema = new Schema<IModelConfig>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'google', 'azure', 'custom']
  },
  modelType: {
    type: String,
    required: true,
    enum: ['chat', 'completion', 'embedding'],
    default: 'chat'
  },
  apiEndpoint: {
    type: String,
    trim: true
  },
  apiKey: {
    type: String,
    trim: true,
    select: false // 默认不返回API密钥
  },
  maxTokens: {
    type: Number,
    required: true,
    min: 1,
    max: 128000,
    default: 4096
  },
  temperature: {
    type: Number,
    required: true,
    min: 0,
    max: 2,
    default: 0.7
  },
  topP: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 1
  },
  frequencyPenalty: {
    type: Number,
    required: true,
    min: -2,
    max: 2,
    default: 0
  },
  presencePenalty: {
    type: Number,
    required: true,
    min: -2,
    max: 2,
    default: 0
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  isDefault: {
    type: Boolean,
    required: true,
    default: false
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  capabilities: [{
    type: String,
    trim: true
  }],
  pricing: {
    inputTokenPrice: {
      type: Number,
      min: 0
    },
    outputTokenPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: 3
    }
  },
  rateLimits: {
    requestsPerMinute: {
      type: Number,
      min: 1,
      default: 60
    },
    tokensPerMinute: {
      type: Number,
      min: 1,
      default: 10000
    }
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete (ret as any).__v;
      return ret;
    }
  }
});

// 索引
ModelConfigSchema.index({ owner: 1, name: 1 });
ModelConfigSchema.index({ provider: 1, isActive: 1 });
ModelConfigSchema.index({ isDefault: 1 });

// 中间件：确保每个用户只有一个默认模型
ModelConfigSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await ModelConfig.updateMany(
      { owner: this.owner, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export const ModelConfig = mongoose.model<IModelConfig>('ModelConfig', ModelConfigSchema);