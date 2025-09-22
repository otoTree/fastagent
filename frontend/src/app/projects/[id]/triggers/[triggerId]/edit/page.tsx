'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useAuthStore } from '@/stores/auth';
import { useTriggerStore } from '@/stores/triggers';
import { useProjectStore } from '@/stores/projects';
import { Trigger, WebhookConfig, ScheduleConfig, EventConfig, ApiConfig, TriggerType } from '@/types';

export default function EditTriggerPage() {
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
    updateTrigger,
  } = useTriggerStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'webhook' as TriggerType,
    isActive: true,
    config: {} as WebhookConfig | ScheduleConfig | EventConfig | ApiConfig,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 当触发器数据加载完成时，初始化表单数据
  useEffect(() => {
    if (currentTrigger) {
      setFormData({
        name: currentTrigger.name,
        description: currentTrigger.description || '',
        type: currentTrigger.type,
        isActive: currentTrigger.isActive,
        config: currentTrigger.config || {},
      });
    }
  }, [currentTrigger]);

  // 如果正在加载认证状态，显示加载界面
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，不渲染内容（会被重定向到登录页）
  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('请输入触发器名称');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTrigger(triggerId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        isActive: formData.isActive,
        config: formData.config,
      });
      
      toast.success('触发器更新成功');
      router.push(`/projects/${projectId}/triggers/${triggerId}`);
    } catch (error) {
      toast.error('更新触发器失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfigChange = (key: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

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

  if (triggerLoading || !currentTrigger) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (triggerError) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-red-600 mb-4">{triggerError}</p>
          <Button onClick={() => router.push(`/projects/${projectId}?tab=triggers`)}>
            返回触发器列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/triggers/${triggerId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">编辑触发器</h1>
            <p className="text-muted-foreground">修改触发器配置</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                设置触发器的基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">触发器名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入触发器名称"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入触发器描述（可选）"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">启用触发器</Label>
              </div>
            </CardContent>
          </Card>

          {/* 触发器类型配置 */}
          <Card>
            <CardHeader>
              <CardTitle>触发器配置</CardTitle>
              <CardDescription>
                配置{formData.type}触发器的具体参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.type === 'webhook' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="httpMethod">HTTP方法</Label>
                    <Select
                      value={(formData.config as WebhookConfig)?.httpMethod || 'POST'}
                      onValueChange={(value) => handleConfigChange('httpMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择HTTP方法" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responseFormat">响应格式</Label>
                    <Select
                      value={(formData.config as WebhookConfig)?.responseFormat || 'json'}
                      onValueChange={(value) => handleConfigChange('responseFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择响应格式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout">超时时间（毫秒）</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={(formData.config as WebhookConfig)?.timeout || 30000}
                      onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                      min="1000"
                      max="300000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryCount">重试次数</Label>
                    <Input
                      id="retryCount"
                      type="number"
                      value={(formData.config as WebhookConfig)?.retryCount || 3}
                      onChange={(e) => handleConfigChange('retryCount', parseInt(e.target.value))}
                      min="0"
                      max="10"
                    />
                  </div>
                </>
              )}

              {formData.type === 'schedule' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cronExpression">Cron表达式</Label>
                    <Input
                      id="cronExpression"
                      value={(formData.config as ScheduleConfig)?.cronExpression || '0 0 * * *'}
                      onChange={(e) => handleConfigChange('cronExpression', e.target.value)}
                      placeholder="0 0 * * *"
                    />
                    <p className="text-sm text-muted-foreground">
                      例如：0 0 * * * (每天午夜执行)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">时区</Label>
                    <Select
                      value={(formData.config as ScheduleConfig)?.timezone || 'Asia/Shanghai'}
                      onValueChange={(value) => handleConfigChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择时区" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.type === 'event' && (
                <div className="space-y-2">
                  <Label htmlFor="eventType">事件类型</Label>
                  <Input
                    id="eventType"
                    value={(formData.config as EventConfig)?.eventType || ''}
                    onChange={(e) => handleConfigChange('eventType', e.target.value)}
                    placeholder="输入事件类型"
                  />
                </div>
              )}

              {formData.type === 'api' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">API端点</Label>
                    <Input
                      id="endpoint"
                      value={(formData.config as ApiConfig)?.endpoint || ''}
                      onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="method">HTTP方法</Label>
                    <Select
                      value={(formData.config as ApiConfig)?.method || 'GET'}
                      onValueChange={(value) => handleConfigChange('method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择HTTP方法" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headers">请求头（JSON格式）</Label>
                    <Textarea
                      id="headers"
                      value={JSON.stringify((formData.config as ApiConfig)?.headers || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const headers = JSON.parse(e.target.value);
                          handleConfigChange('headers', headers);
                        } catch (error) {
                          // 忽略JSON解析错误，让用户继续编辑
                        }
                      }}
                      placeholder='{"Authorization": "Bearer token"}'
                      rows={4}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/triggers/${triggerId}`)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存更改
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}