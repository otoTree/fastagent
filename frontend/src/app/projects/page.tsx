'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Settings, Trash2, Eye, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/stores/projects';
import { Project } from '@/types';

const ProjectsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('projects');
  
  // Project store
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    searchQuery: projectSearchQuery,
    pagination: projectPagination,
    fetchProjects,
    deleteProject,
    setSearchQuery: setProjectSearchQuery,
  } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  console.log('🔍 项目列表:', projects);

  const handleDeleteProject = async (id: string) => {
    if (confirm('确定要删除这个项目吗？')) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error('删除项目失败:', error);
      }
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{project.name}</CardTitle>
          <CardDescription className="text-sm">
            {project.description || '暂无描述'}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/projects/${project._id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/projects/${project._id}?tab=triggers`)}>
              <Zap className="mr-2 h-4 w-4" />
              触发器
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/projects/${project._id}/edit`)}>
              <Settings className="mr-2 h-4 w-4" />
              编辑项目
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteProject(project._id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除项目
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant={project.isActive ? 'default' : 'secondary'}>
              {project.isActive ? '活跃' : '非活跃'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {project.triggers.length} 个触发器
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );



  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">项目管理</h1>
          <p className="text-muted-foreground">
            管理您的项目和触发器
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="projects">项目</TabsTrigger>
            </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索项目..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                筛选
              </Button>
            </div>
            <Button onClick={() => router.push('/projects/create')}>
              <Plus className="mr-2 h-4 w-4" />
              创建项目
            </Button>
          </div>

          {projectsError && (
            <div className="text-red-600 text-sm">{projectsError}</div>
          )}

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}

          {projects.length === 0 && !projectsLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">还没有创建任何项目</p>
              <Button onClick={() => router.push('/projects/create')}>
                <Plus className="mr-2 h-4 w-4" />
                创建第一个项目
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectsPage;