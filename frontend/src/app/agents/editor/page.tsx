"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, Play, Settings, FileText, Eye, Globe, Lock, Archive } from "lucide-react";
import { CreateAgentFormData, Agent, PublishStatus } from "@/types/agent";
import { AgentBasicInfo } from "@/components/agents/AgentBasicInfo";
import AgentPromptEditor from "@/components/agents/AgentPromptEditor";
import { AgentAdvancedSettings } from "@/components/agents/AgentAdvancedSettings";
import { AgentPreview } from "@/components/agents/AgentPreview";
import { AgentSidebar } from "@/components/agents/AgentSidebar";
import api, { agentApi } from "@/lib/api";
import { toast } from "sonner";

const AgentEditor = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("id");
  const isEditing = !!agentId;

  const [formData, setFormData] = useState<CreateAgentFormData>({
    name: '',
    description: '',
    prompt: '',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    isPublic: false,
    tags: ''
  });
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // 如果是编辑模式，加载现有数据
  useEffect(() => {
    if (isEditing && agentId) {
      loadAgentData(agentId);
    }
  }, [isEditing, agentId]);

  const loadAgentData = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/agents/${id}`);
      if (response.data.success) {
        const agentData = response.data.data;
        setAgent(agentData);
        setFormData({
          name: agentData.name,
          description: agentData.description,
          prompt: agentData.prompt,
          modelName: agentData.modelName,
          temperature: agentData.temperature,
          maxTokens: agentData.maxTokens,
          isPublic: agentData.isPublic,
          tags: agentData.tags?.join(", ") || "",
        });
      }
    } catch (error) {
      console.error("Error loading agent:", error);
      toast.error("加载智能体失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      };

      const response = isEditing 
        ? await api.put(`/agents/${agentId}`, payload)
        : await api.post("/agents", payload);

      if (response.data.success) {
        toast.success(isEditing ? "智能体更新成功" : "智能体创建成功");
        if (isEditing) {
          // 重新加载数据以获取最新状态
          await loadAgentData(agentId!);
        } else {
          // 创建成功后，跳转到编辑页面，这样用户就可以看到发布按钮了
          const newAgentId = response.data.data._id;
          router.push(`/agents/editor?id=${newAgentId}`);
        }
      } else {
        toast.error("保存失败");
        console.error("Failed to save agent:", response.data.message);
      }
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("保存智能体失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!agent || !agentId) return;
    
    // 检查必填字段 - 使用formData而不是agent对象
    if (!formData.name || !formData.description || !formData.prompt) {
      toast.error("发布前请确保智能体有名称、描述和提示词");
      return;
    }

    setPublishing(true);
    try {
      // 先保存当前的编辑内容，确保数据库中的数据是最新的
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      };
      
      await api.put(`/agents/${agentId}`, payload);
      
      // 然后再发布
      const response = await agentApi.publish(agentId);
      if (response.data.success) {
        toast.success("智能体发布成功");
        await loadAgentData(agentId);
      }
    } catch (error) {
      console.error("Error publishing agent:", error);
      toast.error("发布失败，请稍后重试");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!agent || !agentId) return;
    
    setPublishing(true);
    try {
      const response = await agentApi.unpublish(agentId);
      if (response.data.success) {
        toast.success("智能体已取消发布");
        await loadAgentData(agentId);
      }
    } catch (error) {
      console.error("Error unpublishing agent:", error);
      toast.error("取消发布失败，请稍后重试");
    } finally {
      setPublishing(false);
    }
  };

  const handleArchive = async () => {
    if (!agent || !agentId) return;
    
    setPublishing(true);
    try {
      const response = await agentApi.archive(agentId);
      if (response.data.success) {
        toast.success("智能体已归档");
        await loadAgentData(agentId);
      }
    } catch (error) {
      console.error("Error archiving agent:", error);
      toast.error("归档失败，请稍后重试");
    } finally {
      setPublishing(false);
    }
  };

  const handleTest = () => {
    console.log("Testing agent with current configuration:", formData);
  };

  const getPublishStatusInfo = () => {
    if (!agent) return null;
    
    switch (agent.publishStatus) {
      case PublishStatus.PUBLISHED:
        return {
          icon: Globe,
          text: "已发布",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case PublishStatus.ARCHIVED:
        return {
          icon: Archive,
          text: "已归档",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
      default:
        return {
          icon: Lock,
          text: "草稿",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <AgentBasicInfo 
            formData={formData} 
            onChange={(data) => setFormData({ ...formData, ...data })} 
          />
        );

      case "prompt":
        return (
          <AgentPromptEditor 
            formData={formData} 
            setFormData={setFormData}
          />
        );

      case "advanced":
        return (
          <AgentAdvancedSettings 
            formData={formData} 
            onChange={(data) => setFormData({ ...formData, ...data })} 
          />
        );

      case "preview":
        return <AgentPreview formData={formData} />;

      default:
        return null;
    }
  };

  const statusInfo = getPublishStatusInfo();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/agents")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {isEditing ? "编辑智能体" : "创建智能体"}
              </h1>
              {isEditing && statusInfo && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                  <statusInfo.icon className="h-3 w-3" />
                  {statusInfo.text}
                </div>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              {isEditing ? "修改智能体配置和行为" : "设计你的专属AI助手"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 发布相关按钮 */}
          {isEditing && agent && (
            <>
              {agent.publishStatus === PublishStatus.DRAFT && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublish}
                  disabled={publishing || !formData.name || !formData.description || !formData.prompt}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  {publishing ? "发布中..." : "发布"}
                </Button>
              )}
              
              {agent.publishStatus === PublishStatus.PUBLISHED && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnpublish}
                    disabled={publishing}
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    {publishing ? "处理中..." : "取消发布"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchive}
                    disabled={publishing}
                    className="flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    {publishing ? "处理中..." : "归档"}
                  </Button>
                </>
              )}
              
              {agent.publishStatus === PublishStatus.ARCHIVED && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublish}
                  disabled={publishing || !agent.name || !agent.description || !agent.prompt}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  {publishing ? "发布中..." : "重新发布"}
                </Button>
              )}
            </>
          )}
          
          {/* 如果是创建模式，提示用户先保存 */}
          {!isEditing && (
            <div className="text-sm text-gray-500 mr-2">
              保存后可发布智能体
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            测试
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.prompt}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : (isEditing ? "保存" : "创建智能体")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主编辑区域 */}
        <div className="lg:col-span-2">
          {/* 自定义标签页导航 */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("basic")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === "basic"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Settings className="h-4 w-4" />
              基本信息
            </button>
            <button
              onClick={() => setActiveTab("prompt")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === "prompt"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="h-4 w-4" />
              提示词编辑
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === "advanced"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Settings className="h-4 w-4" />
              高级设置
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === "preview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Eye className="h-4 w-4" />
              预览测试
            </button>
          </div>

          {/* 标签页内容 */}
          {renderTabContent()}
        </div>

        {/* 侧边栏预览 */}
        <div className="lg:col-span-1">
          <AgentSidebar formData={formData} agent={agent} />
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;