"use client";

import { ModelConfig } from "@/types/modelConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Trash2, 
  Edit, 
  Power, 
  PowerOff, 
  Star, 
  TestTube,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelConfigCardProps {
  config: ModelConfig;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onSetDefault: () => void;
  onTest: () => void;
}

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'openai': return 'bg-green-100 text-green-800';
    case 'anthropic': return 'bg-orange-100 text-orange-800';
    case 'google': return 'bg-blue-100 text-blue-800';
    case 'azure': return 'bg-purple-100 text-purple-800';
    case 'custom': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getProviderLabel = (provider: string) => {
  switch (provider) {
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic';
    case 'google': return 'Google';
    case 'azure': return 'Azure OpenAI';
    case 'custom': return '自定义';
    default: return provider;
  }
};

const getModelTypeLabel = (type: string) => {
  switch (type) {
    case 'chat': return '对话模型';
    case 'completion': return '补全模型';
    case 'embedding': return '嵌入模型';
    default: return type;
  }
};

export const ModelConfigCard = ({
  config,
  onEdit,
  onDelete,
  onToggleActive,
  onSetDefault,
  onTest
}: ModelConfigCardProps) => {
  return (
    <Card className={`relative transition-all duration-200 hover:shadow-lg ${
      config.isDefault ? 'ring-2 ring-blue-500' : ''
    } ${!config.isActive ? 'opacity-60' : ''}`}>
      {config.isDefault && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-blue-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            默认
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {config.displayName}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {config.name}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTest}>
                <TestTube className="h-4 w-4 mr-2" />
                测试连接
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {config.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    禁用
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    启用
                  </>
                )}
              </DropdownMenuItem>
              {!config.isDefault && (
                <DropdownMenuItem onClick={onSetDefault}>
                  <Star className="h-4 w-4 mr-2" />
                  设为默认
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
                disabled={config.isDefault}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getProviderColor(config.provider)}>
            {getProviderLabel(config.provider)}
          </Badge>
          <Badge variant="outline">
            {getModelTypeLabel(config.modelType)}
          </Badge>
          <Badge variant={config.isActive ? "default" : "secondary"}>
            {config.isActive ? "启用" : "禁用"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        {config.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {config.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">最大令牌:</span>
            <span className="ml-2 font-medium">{config.maxTokens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">温度:</span>
            <span className="ml-2 font-medium">{config.temperature}</span>
          </div>
          <div>
            <span className="text-gray-500">Top P:</span>
            <span className="ml-2 font-medium">{config.topP}</span>
          </div>
          <div>
            <span className="text-gray-500">频率惩罚:</span>
            <span className="ml-2 font-medium">{config.frequencyPenalty}</span>
          </div>
        </div>

        {config.capabilities && config.capabilities.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">功能特性:</p>
            <div className="flex flex-wrap gap-1">
              {config.capabilities.slice(0, 3).map((capability, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {capability}
                </Badge>
              ))}
              {config.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{config.capabilities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span>创建于 {new Date(config.createdAt).toLocaleDateString()}</span>
          {config.updatedAt !== config.createdAt && (
            <span>更新于 {new Date(config.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};