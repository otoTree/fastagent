"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateAgentFormData } from "@/types/agent";
import { ModelConfig } from "@/types/modelConfig";
import { modelConfigApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Database } from "lucide-react";

interface AgentAdvancedSettingsProps {
  formData: CreateAgentFormData;
  onChange: (data: Partial<CreateAgentFormData>) => void;
}

export const AgentAdvancedSettings = ({ formData, onChange }: AgentAdvancedSettingsProps) => {
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // 获取用户的模型配置
  useEffect(() => {
    const fetchModelConfigs = async () => {
      try {
        const response = await modelConfigApi.getAll();
        if (response.data.success) {
          // 只显示激活的模型配置
          const activeConfigs = response.data.data.configs.filter((config: ModelConfig) => config.isActive);
          setModelConfigs(activeConfigs);
          
          // 如果当前选择的模型不在可用列表中，选择默认模型或第一个可用模型
          if (activeConfigs.length > 0) {
            const currentModelExists = activeConfigs.some((config: ModelConfig) => config.name === formData.modelName);
            if (!currentModelExists) {
              const defaultModel = activeConfigs.find((config: ModelConfig) => config.isDefault) || activeConfigs[0];
              onChange({ modelName: defaultModel.name });
            }
          }
        }
      } catch (error) {
        console.error('获取模型配置失败:', error);
        toast.error('获取模型配置失败，将使用默认选项');
        // 如果获取失败，使用默认的硬编码选项
        setModelConfigs([]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModelConfigs();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>高级设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="modelName" className="text-sm font-medium">
            模型选择
          </Label>
          <Select
            value={formData.modelName}
            onValueChange={(value) => onChange({ modelName: value })}
            disabled={loadingModels}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingModels ? "加载中..." : "选择模型"} />
            </SelectTrigger>
            <SelectContent>
               {loadingModels ? (
                 <div className="flex items-center justify-center gap-2 py-2 px-3 text-sm text-muted-foreground">
                   <Loader2 className="h-4 w-4 animate-spin" />
                   加载中...
                 </div>
               ) : modelConfigs.length > 0 ? (
                modelConfigs.map(config => (
                  <SelectItem key={config._id} value={config.name}>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{config.displayName}</span>
                      <span className="text-xs text-muted-foreground">({config.provider})</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {modelConfigs.length > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="h-3 w-3" />
              显示来自您配置的 {modelConfigs.length} 个可用模型
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="temperature" className="text-sm font-medium">
            温度 (Temperature)
          </Label>
          <Input
            id="temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
            placeholder="0.7"
          />
          <p className="text-xs text-muted-foreground">
            控制输出的随机性，0-2之间，值越高输出越随机
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maxTokens" className="text-sm font-medium">
            最大令牌数 (Max Tokens)
          </Label>
          <Input
            id="maxTokens"
            type="number"
            min="1"
            max="4096"
            value={formData.maxTokens}
            onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) })}
            placeholder="2048"
          />
          <p className="text-xs text-muted-foreground">
            限制生成文本的最大长度，建议设置为1024-4096之间
          </p>
        </div>
      </CardContent>
    </Card>
  );
};