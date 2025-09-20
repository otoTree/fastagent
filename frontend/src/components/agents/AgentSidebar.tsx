"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Globe, Lock, Archive } from "lucide-react";
import { CreateAgentFormData, Agent, PublishStatus } from "@/types/agent";

interface AgentSidebarProps {
  formData: CreateAgentFormData;
  agent?: Agent | null;
}

export const AgentSidebar = ({ formData, agent }: AgentSidebarProps) => {
  const getPublishStatusBadge = () => {
    if (!agent) return null;
    
    switch (agent.publishStatus) {
      case PublishStatus.PUBLISHED:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <Globe className="h-3 w-3 mr-1" />
            已发布
          </Badge>
        );
      case PublishStatus.ARCHIVED:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            <Archive className="h-3 w-3 mr-1" />
            已归档
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Lock className="h-3 w-3 mr-1" />
            草稿
          </Badge>
        );
    }
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          预览
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{formData.name || "未命名智能体"}</h3>
            {getPublishStatusBadge()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {formData.description || "暂无描述"}
          </p>
        </div>
        
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">模型配置</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">模型:</span>
              <span>{formData.modelName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">温度:</span>
              <span>{formData.temperature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">最大令牌:</span>
              <span>{formData.maxTokens}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">标签</div>
          <div className="flex flex-wrap gap-1">
            {formData.tags.split(",").map(tag => tag.trim()).filter(Boolean).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {!formData.tags && <span className="text-xs text-gray-500">无标签</span>}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">状态</div>
          <div className="flex items-center gap-2">
            <Badge variant={formData.isPublic ? "default" : "secondary"}>
              {formData.isPublic ? "公开" : "私有"}
            </Badge>
          </div>
        </div>

        {agent && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">统计信息</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">使用次数:</span>
                <span>{agent.usageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间:</span>
                <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
              {agent.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">发布时间:</span>
                  <span>{new Date(agent.publishedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};