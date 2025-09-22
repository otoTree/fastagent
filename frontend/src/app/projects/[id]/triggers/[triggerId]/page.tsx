'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Settings, Trash2, Play, Pause, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Skeleton } from '@/components/ui/skeleton';

import { useAuthStore } from '@/stores/auth';
import { useTriggerStore } from '@/stores/triggers';
import { useProjectStore } from '@/stores/projects';
import { Trigger, WebhookConfig, ScheduleConfig, EventConfig, ApiConfig } from '@/types';

export default function TriggerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const triggerId = params.triggerId as string;
  
  const { isAuthenticated, isLoading: authLoading, isHydrated } = useAuthStore();
  const { currentProject, fetchProject } = useProjectStore();
  const {
    currentTrigger,
    isLoading: triggerLoading,
    error: triggerError,
    fetchTrigger,
    deleteTrigger,
    toggleTrigger,
  } = useTriggerStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // 数据初始化
  useEffect(() => {
    if (projectId && triggerId) {
      fetchProject(projectId);
      fetchTrigger(triggerId);
    }
  }, [projectId, triggerId, fetchProject, fetchTrigger]);

  // 认证检查 - 只在hydration完成后进行
  useEffect(() => {
    if (isHydrated && !authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, isHydrated, router]);

  // 如果正在加载认证状态或未完成hydration，显示加载界面
  if (authLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">请先登录</p>
        </div>
      </div>
    );
  }

  const handleToggleStatus = async () => {
    if (!currentTrigger) return;
    
    try {
      await toggleTrigger(currentTrigger._id);
      toast.success(`触发器已${currentTrigger.isActive ? '禁用' : '启用'}`);
    } catch (error) {
      toast.error('切换触发器状态失败');
    }
  };

  const handleDelete = async () => {
    if (!currentTrigger) return;
    if (!confirm('确定要删除这个触发器吗？此操作不可撤销。')) return;
    
    try {
      await deleteTrigger(currentTrigger._id);
      toast.success('触发器删除成功');
      router.push(`/projects/${projectId}?tab=triggers`);
    } catch (error) {
      toast.error('删除触发器失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return '';
    return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  };

  const handleTestTrigger = async () => {
    if (!currentTrigger) return;
    
    setTestLoading(true);
    try {
      // 这里可以调用测试触发器的API
      toast.success('测试请求已发送');
    } catch (error) {
      toast.error('测试触发器失败');
    } finally {
      setTestLoading(false);
    }
  };



  if (triggerLoading || !currentTrigger) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (triggerError) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600 mb-4">{triggerError}</p>
          <Button onClick={() => router.push(`/projects/${projectId}?tab=triggers`)}>
            返回触发器列表
          </Button>
        </div>
      </div>
    );
  }

  const webhookUrl = currentTrigger.type === 'webhook' 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/triggers/${currentTrigger._id}/trigger`
    : null;

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}?tab=triggers`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{currentTrigger.name}</h1>
              <Badge variant={currentTrigger.isActive ? 'default' : 'secondary'}>
                {currentTrigger.isActive ? '启用' : '禁用'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              className="gap-2"
            >
              {currentTrigger.isActive ? (
                <>
                  <Pause className="h-4 w-4" />
                  禁用
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  启用
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/triggers/${triggerId}/edit`)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              编辑
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          </div>
        </div>

        {currentTrigger.description && (
          <div className="mb-6">
            <p className="text-muted-foreground">{currentTrigger.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">触发器名称</Label>
                <p className="text-sm text-muted-foreground mt-1">{currentTrigger.name}</p>
              </div>
              
              {currentTrigger.description && (
                <div>
                  <Label className="text-sm font-medium">描述</Label>
                  <p className="text-sm text-muted-foreground mt-1">{currentTrigger.description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">类型</Label>
                <Badge variant="outline" className="mt-1">{currentTrigger.type}</Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium">创建时间</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(currentTrigger.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 配置信息 */}
          <Card>
            <CardHeader>
              <CardTitle>配置信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTrigger.type === 'webhook' && (
                <>
                  <div>
                    <Label className="text-sm font-medium">HTTP方法</Label>
                    <Badge variant="outline" className="mt-1">
                      {(currentTrigger.config as WebhookConfig)?.httpMethod || 'POST'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">响应格式</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(currentTrigger.config as WebhookConfig)?.responseFormat?.toUpperCase() || 'JSON'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">超时时间</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {((currentTrigger.config as WebhookConfig)?.timeout || 30000) / 1000}秒
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">重试次数</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(currentTrigger.config as WebhookConfig)?.retryCount || 3}次
                    </p>
                  </div>
                </>
              )}

              {currentTrigger.type === 'schedule' && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Cron表达式</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(currentTrigger.config as ScheduleConfig)?.cronExpression || '0 0 * * *'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">时区</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(currentTrigger.config as ScheduleConfig)?.timezone || 'Asia/Shanghai'}
                    </p>
                  </div>
                </>
              )}

              {currentTrigger.type === 'event' && (
                <div>
                  <Label className="text-sm font-medium">事件类型</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(currentTrigger.config as EventConfig)?.eventType || '未设置'}
                  </p>
                </div>
              )}

              {currentTrigger.type === 'api' && (
                <>
                  <div>
                    <Label className="text-sm font-medium">端点</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(currentTrigger.config as ApiConfig)?.endpoint || '未设置'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">方法</Label>
                    <Badge variant="outline" className="mt-1">
                      {(currentTrigger.config as ApiConfig)?.method || 'GET'}
                    </Badge>
                  </div>
                </>
              )}

              <div>
                <Label className="text-sm font-medium">状态</Label>
                <Badge variant={currentTrigger.isActive ? 'default' : 'secondary'} className="mt-1">
                  {currentTrigger.isActive ? '启用' : '禁用'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhook特有的配置 */}
        {currentTrigger.type === 'webhook' && webhookUrl && (
          <div className="mt-6 space-y-6">
            {/* Webhook URL */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook URL</CardTitle>
                <CardDescription>
                  使用此URL来触发webhook，请在请求头中包含API密钥
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API密钥 */}
            {currentTrigger.apiKey && (
              <Card>
                <CardHeader>
                  <CardTitle>API密钥</CardTitle>
                  <CardDescription>
                    在请求头中使用 X-API-Key 包含此密钥
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={showApiKey ? currentTrigger.apiKey : maskApiKey(currentTrigger.apiKey)}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? '隐藏' : '显示'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentTrigger.apiKey || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 示例代码 */}
            <Card>
              <CardHeader>
                <CardTitle>示例代码</CardTitle>
                <CardDescription>
                  使用curl命令测试webhook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {`curl -X ${(currentTrigger.config as WebhookConfig)?.httpMethod || 'POST'} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${showApiKey ? currentTrigger.apiKey : 'YOUR_API_KEY'}" \\
  -d '{"message": "test"}' \\
  ${webhookUrl}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* 测试触发器 */}
            <Card>
              <CardHeader>
                <CardTitle>测试触发器</CardTitle>
                <CardDescription>
                  发送测试请求来验证触发器是否正常工作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder='{"message": "test"}'
                    className="font-mono text-sm"
                    rows={4}
                  />
                  <Button
                    onClick={handleTestTrigger}
                    disabled={testLoading || !currentTrigger.isActive}
                    className="gap-2"
                  >
                    {testLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    发送测试请求
                  </Button>
                  {!currentTrigger.isActive && (
                    <p className="text-sm text-muted-foreground">
                      触发器已禁用，请先启用后再测试
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}