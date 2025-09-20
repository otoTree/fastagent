"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateAgentFormData } from "@/types/agent";

interface AgentBasicInfoProps {
  formData: CreateAgentFormData;
  onChange: (data: Partial<CreateAgentFormData>) => void;
}

export const AgentBasicInfo = ({ formData, onChange }: AgentBasicInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">智能体名称 *</label>
          <Input
            required
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="为你的智能体起个名字"
            className="text-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">描述</label>
          <Input
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="简要描述智能体的功能和用途"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">标签</label>
          <Input
            value={formData.tags}
            onChange={(e) => onChange({ tags: e.target.value })}
            placeholder="用逗号分隔，如：助手, 客服, 写作"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.split(",").map(tag => tag.trim()).filter(Boolean).map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => onChange({ isPublic: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="isPublic" className="text-sm">
            公开智能体（其他用户可以发现和使用）
          </label>
        </div>
      </CardContent>
    </Card>
  );
};