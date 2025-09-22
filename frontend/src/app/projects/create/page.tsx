'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore } from '@/stores/projects';
import { CreateProjectInput } from '@/types';
import { agentApi } from '@/lib/api';
import { Agent, PublishStatus } from '@/types/agent';

const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').max(100, '项目名称不能超过100个字符'),
  description: z.string().optional().or(z.literal('')),
  agentId: z.string().min(1, '请选择一个智能体'),
  isActive: z.boolean(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

const CreateProjectPage = () => {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      agentId: '',
      isActive: true,
    },
  });

  // 获取已发布的智能体列表
  useEffect(() => {
    const fetchPublishedAgents = async () => {
      try {
        setLoadingAgents(true);
        const response = await agentApi.getPublicAgents();
        if (response.data.success) {
          // 直接使用返回的agents数组，因为后端已经过滤了已发布的智能体
          setAgents(response.data.data.agents);
        }
      } catch (error) {
        console.error('获取智能体列表失败:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchPublishedAgents();
  }, []);

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      setIsLoading(true);
      
      const projectData: CreateProjectInput = {
        name: data.name,
        description: data.description || '',
        agentId: data.agentId,
        isActive: data.isActive,
      };

      await createProject(projectData);
      router.push('/projects');
    } catch (error) {
      console.error('创建项目失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">创建项目</h1>
            <p className="text-muted-foreground">
            创建一个新的项目来管理您的智能体和触发器
          </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>项目信息</CardTitle>
            <CardDescription>
                填写项目的基本信息，创建后可以在项目中添加触发器
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>项目名称 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="输入项目名称"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        为您的项目起一个有意义的名称
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
                      <FormLabel>项目描述</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="描述这个项目的用途和功能..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        简要描述项目的用途和功能（可选）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>关联智能体 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择要关联的智能体" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingAgents ? (
                            <SelectItem value="loading" disabled>
                              加载中...
                            </SelectItem>
                          ) : agents.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              暂无已发布的智能体
                            </SelectItem>
                          ) : (
                            agents.map((agent) => (
                              <SelectItem key={agent._id} value={agent._id}>
                                {agent.name} - {agent.description || '无描述'}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        选择此项目要关联的智能体
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
                          启用项目
                        </FormLabel>
                        <FormDescription>
                    启用后，项目中的触发器将可以正常工作
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

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? '创建中...' : '创建项目'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProjectPage;