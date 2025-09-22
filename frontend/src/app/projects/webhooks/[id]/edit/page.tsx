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
import { Skeleton } from '@/components/ui/skeleton';

import { UpdateWebhookTriggerInput } from '@/types';
import { useWebhookStore } from '@/stores/webhooks';
import { useAuthStore } from '@/stores/auth';

const updateWebhookSchema = z.object({
  name: z.string().min(1, "触发器名称不能为空").max(100, "名称不能超过100个字符"),
  description: z.string().max(500, "描述不能超过500个字符").optional().or(z.literal("")),
  httpMethod: z.enum(["GET", "POST", "PUT", "DELETE"]),
  responseFormat: z.enum(["json", "text", "html"]),
  timeout: z.number().min(1000).max(30000),
  retryCount: z.number().min(0).max(5),
  retryDelay: z.number().min(1000).max(60000),
  isActive: z.boolean(),
});

type UpdateWebhookFormData = z.infer<typeof updateWebhookSchema>;

export default function EditWebhookPage() {
  const router = useRouter();
  const params = useParams();
  const webhookId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { currentWebhook, fetchWebhook, updateWebhook } = useWebhookStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateWebhookFormData>({
    resolver: zodResolver(updateWebhookSchema),
    defaultValues: {
      name: '',
      description: '',
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

  // 加载webhook数据
  useEffect(() => {
    if (webhookId && isAuthenticated) {
      fetchWebhook(webhookId);
    }
  }, [webhookId, fetchWebhook, isAuthenticated]);

  // 当webhook数据加载完成后，填充表单
  useEffect(() => {
    if (currentWebhook) {
      reset({
        name: currentWebhook.name,
        description: currentWebhook.description || '',
        httpMethod: currentWebhook.httpMethod,
        responseFormat: currentWebhook.responseFormat,
        timeout: currentWebhook.timeout,
        retryCount: currentWebhook.retryCount,
        retryDelay: currentWebhook.retryDelay,
        isActive: currentWebhook.isActive,
      });
    }
  }, [currentWebhook, reset]);

  const watchedValues = watch();

  const onSubmit = async (data: UpdateWebhookFormData) => {
    try {
      setLoading(true);
      
      await updateWebhook(webhookId, data);
      
      toast.success('Webhook触发器更新成功');
      router.push(`/projects/webhooks/${webhookId}`);
    } catch (error) {
      console.error('Failed to update webhook trigger:', error);
      toast.error('更新Webhook触发器失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/projects/webhooks/${webhookId}`);
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

  if (!currentWebhook) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold">编辑Webhook触发器</h1>
          <p className="text-muted-foreground">
            修改webhook触发器的配置和设置
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
                      修改webhook触发器的基本信息
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

                    {/* Agent Information (Read-only) */}
                    <div className="space-y-2">
                      <Label>关联智能体</Label>
                      <div className="p-3 border rounded-md bg-muted/50">
                        <div className="text-sm text-muted-foreground">
                          智能体关联无法修改，如需更改请重新创建触发器
                        </div>
                      </div>
                    </div>

                    {/* HTTP Method */}
                    <div className="space-y-2">
                      <Label htmlFor="httpMethod">HTTP方法</Label>
                      <Select 
                        value={watchedValues.httpMethod}
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
                        value={watchedValues.responseFormat}
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
                      配置超时、重试等高级选项
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
                      <p className="text-sm text-muted-foreground">
                        请求超时时间，范围：1000-30000毫秒
                      </p>
                      {errors.timeout && (
                        <p className="text-sm text-red-500">{errors.timeout.message}</p>
                      )}
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
                      <p className="text-sm text-muted-foreground">
                        失败时的重试次数，范围：0-5次
                      </p>
                      {errors.retryCount && (
                        <p className="text-sm text-red-500">{errors.retryCount.message}</p>
                      )}
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
                      <p className="text-sm text-muted-foreground">
                        重试间隔时间，范围：1000-60000毫秒
                      </p>
                      {errors.retryDelay && (
                        <p className="text-sm text-red-500">{errors.retryDelay.message}</p>
                      )}
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
                      管理触发器的安全设置和状态
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Active Status */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isActive">启用触发器</Label>
                        <p className="text-sm text-muted-foreground">
                          禁用后，此触发器将不会响应webhook请求
                        </p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={watchedValues.isActive}
                        onCheckedChange={(checked) => setValue("isActive", checked)}
                      />
                    </div>

                    {/* API Key Info */}
                    <div className="space-y-2">
                      <Label>API密钥</Label>
                      <div className="p-3 border rounded-md bg-muted/50">
                        <p className="text-sm text-muted-foreground">
                          API密钥用于验证webhook请求的身份。如需重新生成，请在详情页面操作。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Configuration Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">当前配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">名称:</span>
                  <span className="font-medium">{watchedValues.name || '未设置'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HTTP方法:</span>
                  <span className="font-medium">{watchedValues.httpMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">响应格式:</span>
                  <span className="font-medium">{watchedValues.responseFormat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">超时时间:</span>
                  <span className="font-medium">{watchedValues.timeout}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">重试次数:</span>
                  <span className="font-medium">{watchedValues.retryCount}次</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">状态:</span>
                  <span className={`font-medium ${watchedValues.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {watchedValues.isActive ? '启用' : '禁用'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? '保存中...' : '保存更改'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleBack}
                disabled={loading}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}