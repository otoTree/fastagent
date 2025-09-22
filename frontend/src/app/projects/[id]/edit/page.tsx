'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectStore } from '@/stores/projects';
import { toast } from 'sonner';

// 表单验证schema
const editProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').max(100, '项目名称不能超过100个字符'),
  description: z.string().max(500, '项目描述不能超过500个字符').optional(),
  agentId: z.string().min(1, '智能体ID不能为空'),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

const EditProjectPage = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
  });

  // 加载项目数据
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  // 当项目数据加载完成后，填充表单
  useEffect(() => {
    if (currentProject) {
      reset({
        name: currentProject.name,
        description: currentProject.description || '',
        agentId: currentProject.agentId,
      });
    }
  }, [currentProject, reset]);

  const onSubmit = async (data: EditProjectForm) => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      await updateProject(projectId, data);
      toast.success('项目更新成功');
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error('项目更新失败');
      console.error('更新项目失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}`);
  };

  if (!currentProject) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载项目信息中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">编辑项目</h1>
          <p className="text-muted-foreground">
            修改项目的基本信息和配置
          </p>
        </div>
      </div>

      {/* 编辑表单 */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
          <CardDescription>
            更新项目的名称、描述和关联的智能体
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 项目名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="请输入项目名称"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 项目描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">项目描述</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="请输入项目描述（可选）"
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* 智能体ID */}
            <div className="space-y-2">
              <Label htmlFor="agentId">智能体ID *</Label>
              <Input
                id="agentId"
                {...register('agentId')}
                placeholder="请输入智能体ID"
                className={errors.agentId ? 'border-red-500' : ''}
              />
              {errors.agentId && (
                <p className="text-sm text-red-500">{errors.agentId.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                智能体ID用于关联项目与特定的AI智能体
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isLoading ? '保存中...' : '保存更改'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProjectPage;