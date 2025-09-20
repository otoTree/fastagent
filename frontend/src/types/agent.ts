export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface Agent {
  _id: string;
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
  publishedAt?: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentsResponse {
  success: boolean;
  data: {
    agents: Agent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CreateAgentFormData {
  name: string;
  description: string;
  prompt: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  tags: string;
}

export interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
  token: string | null;
  onUpdate: () => void;
}

export interface CreateAgentFormProps {
  onSuccess: () => void;
  token: string | null;
}

export interface AgentsGridProps {
  agents: Agent[];
  onDelete: (id: string) => void;
  token: string | null;
  onUpdate: () => void;
  onCreateAgent: () => void;
}

export interface AgentsSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: (e: React.FormEvent) => void;
}