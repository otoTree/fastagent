// 插件相关类型定义
export interface I18nString {
  en: string;
  'zh-CN': string;
  'zh-Hant': string;
}

export interface InputConfig {
  key: string;
  label: I18nString;
  type: string;
  required?: boolean;
  description?: string;
}

export interface OutputConfig {
  key: string;
  label: I18nString;
  type: string;
  description?: string;
}

export interface VersionListItem {
  value: string;
  description?: string;
  inputs: InputConfig[];
  outputs: OutputConfig[];
}

export enum ToolTypeEnum {
  tools = 'tools',
  search = 'search',
  multimodal = 'multimodal',
  communication = 'communication',
  finance = 'finance',
  design = 'design',
  productivity = 'productivity',
  news = 'news',
  entertainment = 'entertainment',
  social = 'social',
  scientific = 'scientific',
  other = 'other'
}

export interface ToolListItem {
  id: string;
  parentId?: string;
  author?: string;
  courseUrl?: string;
  name: I18nString;
  avatar: string;
  versionList: VersionListItem[];
  description: I18nString;
  toolDescription?: string;
  templateType: ToolTypeEnum;
  pluginOrder: number;
  isActive: boolean;
  weight: number;
  originCost: number;
  currentCost: number;
  hasTokenFee: boolean;
  secretInputConfig?: InputConfig[];
}

export interface ToolType {
  type: ToolTypeEnum;
  name: I18nString;
}

// API 响应类型
export interface PluginListResponse {
  data: ToolListItem[];
}

export interface PluginDetailResponse {
  data: ToolListItem;
}

export interface PluginTypesResponse {
  data: ToolType[];
}