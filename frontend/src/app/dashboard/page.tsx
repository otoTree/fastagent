"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, FileText, BarChart3, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuthStore } from "@/stores/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, token } = useAuthStore();
  const [agentCount, setAgentCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/auth/login");
      return;
    }
    
    if (isAuthenticated && token) {
      fetchAgentCount();
    }
  }, [isAuthenticated, isLoading, router, token]);

  const fetchAgentCount = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('http://localhost:4001/api/agents?limit=1', {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgentCount(data.data.pagination.total || 0);
      } else {
        console.error("Failed to fetch agent count");
      }
    } catch (error) {
      console.error("Error fetching agent count:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            欢迎回来，{user.username}！
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            这是您的FastAgent控制面板，您可以在这里管理您的AI智能体和项目。
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/agents')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">智能体数量</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
                ) : (
                  agentCount
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                点击管理智能体
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">项目数量</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                暂无项目
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月使用量</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                API调用次数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>
                快速开始您的AI智能体开发
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push('/agents')}
              >
                 <Bot className="h-4 w-4 mr-2" />
                 管理智能体
               </Button>
               <Button className="w-full justify-start" variant="outline">
                 <FileText className="h-4 w-4 mr-2" />
                 新建项目
               </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                账户设置
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快速开始</CardTitle>
              <CardDescription>
                了解如何使用FastAgent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">1. 创建您的第一个智能体</h4>
                <p className="text-sm text-muted-foreground">
                  点击&ldquo;创建新智能体&rdquo;开始构建您的AI助手
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">2. 配置智能体能力</h4>
                <p className="text-sm text-muted-foreground">
                  设置智能体的技能、知识库和工作流程
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">3. 部署和测试</h4>
                <p className="text-sm text-muted-foreground">
                  将智能体部署到生产环境并进行测试
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>
              您最近的操作记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无活动记录</p>
              <p className="text-sm">开始创建智能体后，这里将显示您的操作历史</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}