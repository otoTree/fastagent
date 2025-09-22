'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useProjectStore } from '@/stores/projects';
import { useAuthStore } from '@/stores/auth';
import { useTriggerStore } from '@/stores/triggers';
import { toast } from 'sonner';

// 简化的表单Schema
const createTriggerSchema = z.object({
  name: z.string().min(1, '触发器名称不能为空'),
  description: z.string().optional(),
  type: z.enum(['webhook', 'schedule', 'event', 'api']),
  isActive: z.boolean().default(true),
  // Webhook配置
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  responseFormat: z.enum(['json', 'text', 'html']).optional(),
  timeout: z.number().optional(),
  retryCount: z.number().optional(),
  retryDelay: z.number().optional(),
  // Schedule配置
  cronExpression: z.string().optional(),
  timezone: z.string().optional(),
  // Event配置
  eventType: z.string().optional(),
  // API配置
  endpoint: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
});

type CreateTriggerFormData = z.infer<typeof createTriggerSchema>;

export default function CreateTriggerPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const { user } = useAuthStore();
  const { currentProject, fetchProject } = useProjectStore();
  const { createTrigger, isLoading } = useTriggerStore();
  
  const [selectedType, setSelectedType] = useState<'webhook' | 'schedule' | 'event' | 'api'>('webhook');

  const form = useForm<CreateTriggerFormData>({
    resolver: zodResolver(createTriggerSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'webhook',
      isActive: true,
      httpMethod: 'POST',
      responseFormat: 'json',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      cronExpression: '0 0 * * *',
      timezone: 'Asia/Shanghai',
      eventType: '',
      endpoint: '',
      method: 'GET',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (projectId && !currentProject) {
      fetchProject(projectId);
    }
  }, [user, projectId, currentProject, fetchProject, router]);

  const onSubmit = async (data: CreateTriggerFormData) => {
    try {
      // 根据类型构建配置对象
      let config: any = {};
      
      switch (data.type) {
        case 'webhook':
          config = {
            httpMethod: data.httpMethod || 'POST',
            responseFormat: data.responseFormat || 'json',
            timeout: data.timeout || 30000,
            retryCount: data.retryCount || 3,
            retryDelay: data.retryDelay || 1000,
          };
          break;
        case 'schedule':
          config = {
            cronExpression: data.cronExpression || '0 0 * * *',
            timezone: data.timezone || 'Asia/Shanghai',
          };
          break;
        case 'event':
          config = {
            eventType: data.eventType || '',
          };
          break;
        case 'api':
          config = {
            endpoint: data.endpoint || '',
            method: data.method || 'GET',
          };
          break;
      }

      const triggerData = {
        name: data.name,
        description: data.description,
        type: data.type,
        projectId,
        agentId: currentProject?.agentId || '',
        config,
        isActive: data.isActive,
      };

      await createTrigger(triggerData);
      toast.success('触发器创建成功');
      router.push(`/projects/${projectId}?tab=triggers`);
    } catch (error) {
      console.error('创建触发器失败:', error);
      toast.error('创建触发器失败');
    }
  };

  const handleTypeChange = (type: 'webhook' | 'schedule' | 'event' | 'api') => {
    setSelectedType(type);
    form.setValue('type', type);
  };

  if (!user || !currentProject) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}?tab=triggers`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold">创建触发器</h1>
          <p className="text-muted-foreground">为项目 {currentProject.name} 创建新的触发器</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                配置触发器的基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>触发器名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入触发器名称" {...field} />
                    </FormControl>
                    <FormDescription>
                      为触发器设置一个易于识别的名称
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="输入触发器描述（可选）" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      描述触发器的用途和功能
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        启用触发器
                      </FormLabel>
                      <FormDescription>
                        创建后立即启用此触发器
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>触发器类型</CardTitle>
              <CardDescription>
                选择触发器的类型和配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>类型选择</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => handleTypeChange(value as any)}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="webhook" id="webhook" />
                          <Label htmlFor="webhook">Webhook 触发器</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="schedule" id="schedule" />
                          <Label htmlFor="schedule">定时触发器</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="event" id="event" />
                          <Label htmlFor="event">事件触发器</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="api" id="api" />
                          <Label htmlFor="api">API 触发器</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Webhook配置 */}
          {selectedType === 'webhook' && (
            <Card>
              <CardHeader>
                <CardTitle>Webhook 配置</CardTitle>
                <CardDescription>
                  配置 Webhook 触发器的参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="httpMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HTTP 方法</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择 HTTP 方法" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responseFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>响应格式</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择响应格式" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>超时时间 (毫秒)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="30000" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        请求超时时间，范围：1000-300000毫秒
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retryCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>重试次数</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="3" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        失败时的重试次数，范围：0-10次
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retryDelay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>重试延迟 (毫秒)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        重试间隔时间，范围：100-60000毫秒
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Schedule配置 */}
          {selectedType === 'schedule' && (
            <Card>
              <CardHeader>
                <CardTitle>定时配置</CardTitle>
                <CardDescription>
                  配置定时触发器的时间规则
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="cronExpression"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cron 表达式</FormLabel>
                      <FormControl>
                        <Input placeholder="0 0 * * *" {...field} />
                      </FormControl>
                      <FormDescription>
                        使用 Cron 表达式定义执行时间，例如：0 0 * * * (每天午夜)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>时区</FormLabel>
                      <FormControl>
                        <Input placeholder="Asia/Shanghai" {...field} />
                      </FormControl>
                      <FormDescription>
                        设置执行时区，默认为 Asia/Shanghai
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Event配置 */}
          {selectedType === 'event' && (
            <Card>
              <CardHeader>
                <CardTitle>事件配置</CardTitle>
                <CardDescription>
                  配置事件触发器的监听条件
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>事件类型</FormLabel>
                      <FormControl>
                        <Input placeholder="输入事件类型" {...field} />
                      </FormControl>
                      <FormDescription>
                        定义要监听的事件类型
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* API配置 */}
          {selectedType === 'api' && (
            <Card>
              <CardHeader>
                <CardTitle>API 配置</CardTitle>
                <CardDescription>
                  配置 API 触发器的调用参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API 端点</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.example.com/endpoint" {...field} />
                      </FormControl>
                      <FormDescription>
                        要调用的 API 端点 URL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>请求方法</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择请求方法" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}?tab=triggers`)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '创建中...' : '创建触发器'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}