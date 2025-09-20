"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Play } from "lucide-react";
import { CreateAgentFormData } from "@/types/agent";

interface AgentPreviewProps {
  formData: CreateAgentFormData;
}

export const AgentPreview = ({ formData }: AgentPreviewProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">智能体预览</h3>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {formData.name || '未命名智能体'}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {formData.description || '暂无描述'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">模型:</span>
                <span className="ml-2">{formData.modelName}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">温度:</span>
                <span className="ml-2">{formData.temperature}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">最大令牌:</span>
                <span className="ml-2">{formData.maxTokens}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">标签:</span>
                <span className="ml-2">{formData.tags || '无'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">公开状态:</span>
                <span className="ml-2">{formData.isPublic ? '公开' : '私有'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">测试对话</h3>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">系统提示词:</p>
                <p className="text-sm">{formData.prompt || '暂无系统提示词'}</p>
              </div>
              
              <div className="border-t pt-4">
                <label htmlFor="testMessage" className="block text-sm font-medium mb-2">测试消息</label>
                <textarea
                  id="testMessage"
                  placeholder="输入一条测试消息..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <Button className="mt-2" disabled>
                  <Play className="mr-2 h-4 w-4" />
                  发送测试 (开发中)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};