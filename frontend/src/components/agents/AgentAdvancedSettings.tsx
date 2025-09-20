"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAgentFormData } from "@/types/agent";

interface AgentAdvancedSettingsProps {
  formData: CreateAgentFormData;
  onChange: (data: Partial<CreateAgentFormData>) => void;
}

export const AgentAdvancedSettings = ({ formData, onChange }: AgentAdvancedSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>模型配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">温度 (Temperature)</label>
          <Input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          />
          <p className="text-sm text-gray-500 mt-1">控制输出的随机性，0-2之间</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">最大令牌数 (Max Tokens)</label>
          <Input
            type="number"
            min="1"
            max="4000"
            value={formData.maxTokens}
            onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) })}
          />
          <p className="text-sm text-gray-500 mt-1">限制生成文本的最大长度</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">模型选择</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.modelName}
            onChange={(e) => onChange({ modelName: e.target.value })}
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
};