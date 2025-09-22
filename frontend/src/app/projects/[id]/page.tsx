'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Settings, Eye, Trash2, MoreHorizontal, Activity, Globe, Key } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import { useProjectStore } from '@/stores/projects';
import { useTriggerStore } from '@/stores/triggers';
import { useAuthStore } from '@/stores/auth';
import { Project, Trigger } from '@/types';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  
  // 从URL参数获取默认标签页，如果没有则默认为'overview'
  const defaultTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const {
    currentProject,
    loading: projectLoading,
    error: projectError,
    fetchProject,
    deleteProject,
  } = useProjectStore();

  const {
    triggers,
    isLoading: triggersLoading,
    error: triggersError,
    fetchTriggers,
    deleteTrigger,
  } = useTriggerStore();

  // 检查认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (projectId && isAuthenticated) {
      fetchProject(projectId);
      // 获取该项目的所有触发器
      fetchTriggers(projectId);
    }
  }, [projectId, fetchProject, fetchTriggers, isAuthenticated]);

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    if (!confirm('确定要删除这个项目吗？这将同时删除项目中的所有触发器。')) return;
    
    try {
      await deleteProject(currentProject._id);
      toast.success('项目删除成功');
      router.push('/projects');
    } catch (error) {
      toast.error('删除项目失败');
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!confirm('确定要删除这个触发器吗？')) return;
    
    try {
      await deleteTrigger(triggerId);
      toast.success('触发器删除成功');
      // 重新获取触发器列表
      fetchTriggers(projectId);
    } catch (error) {
      toast.error('删除触发器失败');
    }
  };

  const TriggerCard = ({ trigger }: { trigger: Trigger }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{trigger.name}</CardTitle>
          <CardDescription className="text-sm">
            {trigger.description || '暂无描述'}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/projects/${projectId}/triggers/${trigger._id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/projects/${projectId}/triggers/${trigger._id}/edit`)}>
              <Settings className="mr-2 h-4 w-4" />
              编辑配置
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteTrigger(trigger._id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除触发器
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
              {trigger.isActive ? '启用' : '禁用'}
            </Badge>
            <Badge variant="outline">{trigger.type}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <div>触发次数: {trigger.triggerCount || 0}</div>
            <div>创建时间: {new Date(trigger.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading) {
    return (
      <div className="container mx-auto py-6">
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

  if (projectLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (projectError || !currentProject) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-red-600 mb-4">{projectError || '项目不存在'}</p>
          <Button onClick={() => router.push('/projects')}>
            返回项目列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/projects')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{currentProject.name}</h1>
              <p className="text-muted-foreground">
                {currentProject.description || '暂无描述'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/edit`)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              编辑项目
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              删除项目
            </Button>
          </div>
        </div>

        {/* Project Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">项目状态</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={currentProject.isActive ? 'default' : 'secondary'}>
                {currentProject.isActive ? '活跃' : '非活跃'}
              </Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">触发器</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{triggers.length}</div>
              <p className="text-xs text-muted-foreground">
                个触发器
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">创建时间</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(currentProject.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="triggers">触发器</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>项目信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">项目名称</h4>
                  <p className="text-sm text-muted-foreground">{currentProject.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">项目描述</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentProject.description || '暂无描述'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">关联智能体ID</h4>
                  <p className="text-sm text-muted-foreground">{currentProject.agentId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">创建时间</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentProject.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">更新时间</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentProject.updatedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">触发器</h3>
                <p className="text-sm text-muted-foreground">
                  管理此项目的触发器
                </p>
              </div>
              <Button 
                onClick={() => router.push(`/projects/${projectId}/triggers/create`)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                创建触发器
              </Button>
            </div>

            {triggersError && (
              <div className="text-red-600 text-sm">{triggersError}</div>
            )}

            {triggersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {triggers.map((trigger) => (
                  <TriggerCard key={trigger._id} trigger={trigger} />
                ))}
              </div>
            )}

            {triggers.length === 0 && !triggersLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">还没有创建任何触发器</p>
                <Button 
                  onClick={() => router.push(`/projects/${projectId}/triggers/create`)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  创建第一个触发器
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}