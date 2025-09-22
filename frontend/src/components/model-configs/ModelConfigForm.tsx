"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { 
  ModelConfig, 
  CreateModelConfigFormData, 
  MODEL_PROVIDERS, 
  MODEL_TYPES,
  DEFAULT_MODEL_CONFIG 
} from "@/types/modelConfig";
import { useModelConfigStore } from "@/stores/modelConfig";
import { toast } from "sonner";

interface ModelConfigFormProps {
  config?: ModelConfig;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ModelConfigForm = ({ config, onSuccess, onCancel }: ModelConfigFormProps) => {
  const { createModelConfig, updateModelConfig } = useModelConfigStore();
  const [loading, setLoading] = useState(false);
  const [newCapability, setNewCapability] = useState("");
  
  const [formData, setFormData] = useState<CreateModelConfigFormData>(() => {
    if (config) {
      return {
        name: config.name,
        displayName: config.displayName,
        provider: config.provider,
        modelType: config.modelType,
        apiEndpoint: config.apiEndpoint || "",
        apiKey: "",
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        topP: config.topP,
        frequencyPenalty: config.frequencyPenalty,
        presencePenalty: config.presencePenalty,
        isActive: config.isActive,
        isDefault: config.isDefault,
        description: config.description || "",
        capabilities: [...config.capabilities],
        pricing: config.pricing ? { ...config.pricing } : {
          inputTokenPrice: 0,
          outputTokenPrice: 0,
          currency: 'USD'
        },
        rateLimits: config.rateLimits ? { ...config.rateLimits } : {
          requestsPerMinute: 60,
          tokensPerMinute: 10000
        }
      };
    }
    return {
      name: "",
      displayName: "",
      provider: "openai",
      modelType: "chat",
      apiEndpoint: "",
      apiKey: "",
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      isActive: true,
      isDefault: false,
      description: "",
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
    } as CreateModelConfigFormData;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (config) {
        await updateModelConfig(config._id, formData);
      } else {
        await createModelConfig(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateModelConfigFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePricingChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        inputTokenPrice: 0,
        outputTokenPrice: 0,
        currency: "USD",
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const handleRateLimitsChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 10000,
        ...prev.rateLimits,
        [field]: value
      }
    }));
  };

  const addCapability = () => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()]
      }));
      setNewCapability("");
    }
  };

  const removeCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本信息</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">配置名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="例如: my-gpt-4"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">显示名称 *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange("displayName", e.target.value)}
              placeholder="例如: 我的 GPT-4 模型"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider">提供商 *</Label>
            <Select 
              value={formData.provider} 
              onValueChange={(value) => handleInputChange("provider", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择提供商" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="modelType">模型类型</Label>
            <Select 
              value={formData.modelType} 
              onValueChange={(value) => handleInputChange("modelType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择模型类型" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="描述这个模型配置的用途..."
            rows={3}
          />
        </div>
      </div>

      {/* API 配置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">API 配置</h3>
        
        <div className="space-y-2">
          <Label htmlFor="apiEndpoint">API 端点</Label>
          <Input
            id="apiEndpoint"
            type="url"
            value={formData.apiEndpoint}
            onChange={(e) => handleInputChange("apiEndpoint", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="apiKey">API 密钥</Label>
          <Input
            id="apiKey"
            type="password"
            value={formData.apiKey}
            onChange={(e) => handleInputChange("apiKey", e.target.value)}
            placeholder={config ? "留空表示不更改" : "输入 API 密钥"}
          />
        </div>
      </div>

      {/* 模型参数 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">模型参数</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>最大令牌数: {formData.maxTokens.toLocaleString()}</Label>
            <Slider
              value={[formData.maxTokens]}
              onValueChange={([value]: number[]) => handleInputChange("maxTokens", value)}
              min={1}
              max={128000}
              step={256}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>温度: {formData.temperature}</Label>
            <Slider
              value={[formData.temperature]}
              onValueChange={([value]: number[]) => handleInputChange("temperature", value)}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Top P: {formData.topP}</Label>
            <Slider
              value={[formData.topP]}
              onValueChange={([value]: number[]) => handleInputChange("topP", value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>频率惩罚: {formData.frequencyPenalty}</Label>
              <Slider
                value={[formData.frequencyPenalty]}
                onValueChange={([value]: number[]) => handleInputChange("frequencyPenalty", value)}
                min={-2}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>存在惩罚: {formData.presencePenalty}</Label>
              <Slider
                value={[formData.presencePenalty]}
                onValueChange={([value]: number[]) => handleInputChange("presencePenalty", value)}
                min={-2}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 功能特性 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">功能特性</h3>
        
        <div className="space-y-2">
          <Label>添加功能特性</Label>
          <div className="flex gap-2">
            <Input
              value={newCapability}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCapability(e.target.value)}
              placeholder="例如: 代码生成, 文本分析"
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && (e.preventDefault(), addCapability())}
            />
            <Button type="button" onClick={addCapability} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {formData.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.capabilities.map((capability, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {capability}
                <button
                  type="button"
                  onClick={() => removeCapability(capability)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 状态设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">状态设置</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>启用状态</Label>
            <p className="text-sm text-gray-600">是否启用此模型配置</p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked: boolean) => handleInputChange("isActive", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>设为默认</Label>
            <p className="text-sm text-gray-600">将此配置设为默认模型</p>
          </div>
          <Switch
            checked={formData.isDefault}
            onCheckedChange={(checked: boolean) => handleInputChange("isDefault", checked)}
          />
        </div>
      </div>

      {/* 表单按钮 */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "保存中..." : (config ? "更新配置" : "创建配置")}
        </Button>
      </div>
    </form>
  );
};