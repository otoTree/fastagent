"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit, 
  Power, 
  PowerOff, 
  Star, 
  TestTube,
  Filter
} from "lucide-react";
import { ModelConfig } from "@/types/modelConfig";
import { ModelConfigCard } from "@/components/model-configs/ModelConfigCard";
import { ModelConfigForm } from "@/components/model-configs/ModelConfigForm";
import { useAuthStore } from "@/stores/auth";
import { useModelConfigStore } from "@/stores/modelConfig";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ModelConfigsPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { 
    modelConfigs, 
    loading, 
    fetchModelConfigs, 
    deleteModelConfig,
    toggleModelConfigActive,
    setDefaultModelConfig,
    testModelConfigConnection
  } = useModelConfigStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ModelConfig | null>(null);

  // 检查认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // 加载模型配置
  useEffect(() => {
    if (isAuthenticated) {
      fetchModelConfigs();
    }
  }, [isAuthenticated, fetchModelConfigs]);

  // 过滤模型配置
  const filteredConfigs = modelConfigs.filter(config => {
    const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (config.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesProvider = providerFilter === "all" || config.provider === providerFilter;
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && config.isActive) ||
                         (statusFilter === "inactive" && !config.isActive);

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("确定要删除这个模型配置吗？")) {
      try {
        await deleteModelConfig(id);
        toast.success("模型配置已删除");
      } catch (error) {
        toast.error("删除失败");
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleModelConfigActive(id);
      toast.success("状态已更新");
    } catch (error) {
      toast.error("状态更新失败");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultModelConfig(id);
      toast.success("已设为默认模型");
    } catch (error) {
      toast.error("设置默认模型失败");
    }
  };

  const handleTest = async (id: string) => {
    try {
      await testModelConfigConnection(id);
      toast.success("连接测试成功");
    } catch (error) {
      toast.error("连接测试失败");
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchModelConfigs();
    toast.success("模型配置创建成功");
  };

  const handleEditSuccess = () => {
    setEditingConfig(null);
    fetchModelConfigs();
    toast.success("模型配置更新成功");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">模型配置管理</h1>
          <p className="text-gray-600 mt-2">管理您的自定义语言模型配置</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新建配置
        </Button>
      </div>

      {/* 搜索和过滤器 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索模型配置..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="选择提供商" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有提供商</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="azure">Azure OpenAI</SelectItem>
            <SelectItem value="custom">自定义</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">禁用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 模型配置列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载模型配置中...</p>
          </div>
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || providerFilter !== "all" || statusFilter !== "all" 
              ? "没有找到匹配的模型配置" 
              : "还没有模型配置"
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || providerFilter !== "all" || statusFilter !== "all"
              ? "尝试调整搜索条件或过滤器"
              : "创建您的第一个自定义模型配置"
            }
          </p>
          {!searchTerm && providerFilter === "all" && statusFilter === "all" && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建配置
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConfigs.map((config) => (
            <ModelConfigCard
              key={config._id}
              config={config}
              onEdit={() => setEditingConfig(config)}
              onDelete={() => handleDelete(config._id)}
              onToggleActive={() => handleToggleActive(config._id)}
              onSetDefault={() => handleSetDefault(config._id)}
              onTest={() => handleTest(config._id)}
            />
          ))}
        </div>
      )}

      {/* 创建模型配置对话框 */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建模型配置</DialogTitle>
          </DialogHeader>
          <ModelConfigForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑模型配置对话框 */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑模型配置</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <ModelConfigForm
              config={editingConfig}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingConfig(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelConfigsPage;