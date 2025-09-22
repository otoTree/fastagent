export interface ModelConfig {
  _id: string;
  name: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  modelType: 'chat' | 'completion' | 'embedding';
  apiEndpoint?: string;
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
    inputTokenPrice: number;
    outputTokenPrice: number;
    currency: string;
  };
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateModelConfigFormData {
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
    inputTokenPrice: number;
    outputTokenPrice: number;
    currency: string;
  };
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface UpdateModelConfigFormData extends Partial<CreateModelConfigFormData> {
  _id?: string;
}

export interface ModelConfigsResponse {
  success: boolean;
  data: {
    configs: ModelConfig[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ModelConfigResponse {
  success: boolean;
  data: ModelConfig;
}

export const MODEL_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'custom', label: '自定义' }
] as const;

export const MODEL_TYPES = [
  { value: 'chat', label: '对话模型' },
  { value: 'completion', label: '补全模型' },
  { value: 'embedding', label: '嵌入模型' }
] as const;

export const DEFAULT_MODEL_CONFIG: Partial<CreateModelConfigFormData> = {
  modelType: 'chat',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  isActive: true,
  isDefault: false,
  capabilities: [],
  pricing: {
    inputTokenPrice: 0,
    outputTokenPrice: 0,
    currency: 'USD'
  },
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 10000
  }
};