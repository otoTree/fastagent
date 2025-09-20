"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CreateAgentFormProps, CreateAgentFormData } from "@/types/agent";

export const CreateAgentForm = ({ 
  onSuccess, 
  token 
}: CreateAgentFormProps) => {
  const [formData, setFormData] = useState<CreateAgentFormData>({
    name: "",
    description: "",
    prompt: "",
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 1000,
    isPublic: false,
    tags: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      };

      const response = await fetch("http://localhost:4001/api/agents", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
      } else {
        console.error("Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">智能体名称</label>
        <Input
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="输入智能体名称"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">描述</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="简要描述智能体的功能"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">系统提示词</label>
        <textarea
          required
          className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          placeholder="定义智能体的角色和行为..."
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">模型</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.modelName}
            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">温度 ({formData.temperature})</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">标签 (用逗号分隔)</label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="助手, 客服, 写作"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
        />
        <label htmlFor="isPublic" className="text-sm">公开智能体</label>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "创建中..." : "创建智能体"}
        </Button>
      </div>
    </form>
  );
};