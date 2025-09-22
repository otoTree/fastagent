'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Key, Globe, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CreateWebhookTriggerInput } from '@/types';
import { useWebhookStore } from '@/stores/webhooks';
import { useProjectStore } from '@/stores/projects';
import { useAuthStore } from '@/stores/auth';
import { agentApi } from '@/services/api';

const createWebhookSchema = z.object({
  name: z.string().min(1, "触发器名称不能为空").max(100, "名称不能超过100个字符"),
  description: z.string().max(500, "描述不能超过500个字符").optional().or(z.literal("")),
  agentId: z.string().min(1, "请选择一个智能体"),
  httpMethod: z.enum(["GET", "POST", "PUT", "DELETE"]),
  responseFormat: z.enum(["json", "text", "html"]),
  timeout: z.number().min(1000).max(30000),
  retryCount: z.number().min(0).max(5),
  retryDelay: z.number().min(1000).max(60000),
  isActive: z.boolean(),
});

type CreateWebhookFormData = z.infer<typeof createWebhookSchema>;

export default function CreateWebhookPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { createWebhook } = useWebhookStore();
  const { currentProject, fetchProject } = useProjectStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateWebhookFormData>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      name: '',
      description: '',
      agentId: '',
      httpMethod: 'POST',
      responseFormat: 'json',
      timeout: 10000,
      retryCount: 3,
      retryDelay: 5000,
      isActive: true,
    },
  });

  // 检查认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // Load project and set agent on component mount
  useEffect(() => {
    if (projectId && isAuthenticated) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject, isAuthenticated]);

  // Set agent ID when project is loaded
  useEffect(() => {
    if (currentProject?.agentId) {
      setValue("agentId", currentProject.agentId);
    }
  }, [currentProject?.agentId, setValue]);

  const watchedValues = watch();

  const onSubmit = async (data: CreateWebhookFormData) => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      
      // 创建webhook触发器数据，包含projectId
      const webhookData = {
        name: data.name,
        description: data.description || undefined,
        agentId: data.agentId,
        httpMethod: data.httpMethod,
        responseFormat: data.responseFormat,
        timeout: data.timeout,
        retryCount: data.retryCount,
        retryDelay: data.retryDelay,
        isActive: data.isActive,
        projectId: projectId, // 传递projectId
      };
      
      await createWebhook(webhookData);
      toast.success('Webhook触发器创建成功');
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('创建webhook触发器失败:', error);
      toast.error('创建webhook触发器失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/projects/${projectId}`);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">创建Webhook触发器</h1>
          <p className="text-muted-foreground">
            配置webhook触发器来自动化您的智能体工作流程
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="gap-2">
                  <Settings className="h-4 w-4" />
                  基本配置
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-2">
                  <Globe className="h-4 w-4" />
                  高级设置
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Key className="h-4 w-4" />
                  安全配置
                </TabsTrigger>
              </TabsList>

              {/* Basic Configuration */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>
                      配置webhook触发器的基本信息和关联智能体
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Trigger Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">触发器名称 *</Label>
                      <Input
                        id="name"
                        placeholder="输入触发器名称"
                        {...register("name")}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">描述</Label>
                      <Textarea
                        id="description"
                        placeholder="输入触发器描述（可选）"
                        rows={3}
                        {...register("description")}
                        className={errors.description ? "border-red-500" : ""}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500">{errors.description.message}</p>
                      )}
                    </div>

                    {/* Agent Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="agentId">关联智能体 *</Label>
                      <div className="p-3 border rounded-md bg-muted/50">
                        {currentProject ? (
                          <div>
                            <div className="font-medium">{currentProject.name}</div>
                            <div className="text-sm text-muted-foreground">
                              当前项目关联的智能体将自动用于此Webhook触发器
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            正在加载项目信息...
                          </div>
                        )}
                      </div>
                      {errors.agentId && (
                        <p className="text-sm text-red-500">{errors.agentId.message}</p>
                      )}
                    </div>

                    {/* HTTP Method */}
                    <div className="space-y-2">
                      <Label htmlFor="httpMethod">HTTP方法</Label>
                      <Select 
                        defaultValue="POST"
                        onValueChange={(value) => setValue("httpMethod", value as "GET" | "POST" | "PUT" | "DELETE")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Response Format */}
                    <div className="space-y-2">
                      <Label htmlFor="responseFormat">响应格式</Label>
                      <Select 
                        defaultValue="json"
                        onValueChange={(value) => setValue("responseFormat", value as "json" | "text" | "html")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="text">纯文本</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Settings */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>高级设置</CardTitle>
                    <CardDescription>
                      配置超时时间、重试策略等高级选项
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Timeout */}
                    <div className="space-y-2">
                      <Label htmlFor="timeout">超时时间 (毫秒)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        min="1000"
                        max="30000"
                        step="1000"
                        {...register("timeout", { valueAsNumber: true })}
                        className={errors.timeout ? "border-red-500" : ""}
                      />
                      {errors.timeout && (
                        <p className="text-sm text-red-500">{errors.timeout.message}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        请求超时时间，范围：1-30秒
                      </p>
                    </div>

                    {/* Retry Count */}
                    <div className="space-y-2">
                      <Label htmlFor="retryCount">重试次数</Label>
                      <Input
                        id="retryCount"
                        type="number"
                        min="0"
                        max="5"
                        {...register("retryCount", { valueAsNumber: true })}
                        className={errors.retryCount ? "border-red-500" : ""}
                      />
                      {errors.retryCount && (
                        <p className="text-sm text-red-500">{errors.retryCount.message}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        失败时的重试次数，范围：0-5次
                      </p>
                    </div>

                    {/* Retry Delay */}
                    <div className="space-y-2">
                      <Label htmlFor="retryDelay">重试延迟 (毫秒)</Label>
                      <Input
                        id="retryDelay"
                        type="number"
                        min="1000"
                        max="60000"
                        step="1000"
                        {...register("retryDelay", { valueAsNumber: true })}
                        className={errors.retryDelay ? "border-red-500" : ""}
                      />
                      {errors.retryDelay && (
                        <p className="text-sm text-red-500">{errors.retryDelay.message}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        重试间隔时间，范围：1-60秒
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Configuration */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>安全配置</CardTitle>
                    <CardDescription>
                      配置API密钥和访问控制选项
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Active Status */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isActive">启用触发器</Label>
                        <p className="text-sm text-muted-foreground">
                          启用后触发器才能接收和处理webhook请求
                        </p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={watchedValues.isActive}
                        onCheckedChange={(checked) => setValue("isActive", checked)}
                      />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">API密钥说明</h4>
                      <p className="text-sm text-blue-700">
                        创建触发器后，系统将自动生成一个唯一的API密钥。
                        调用webhook时需要在请求头中包含此密钥进行身份验证。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">配置预览</CardTitle>
                <CardDescription>
                  当前配置的预览信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">触发器名称</Label>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.name || "未设置"}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">HTTP方法</Label>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.httpMethod}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">响应格式</Label>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.responseFormat?.toUpperCase()}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">超时时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.timeout / 1000}秒
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">重试配置</Label>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.retryCount}次，间隔{watchedValues.retryDelay / 1000}秒
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">状态</Label>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.isActive ? "启用" : "禁用"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" onClick={handleBack}>
            取消
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            创建触发器
          </Button>
        </div>
      </form>
    </div>
  );
}