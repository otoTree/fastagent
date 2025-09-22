'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Play, Pause, Trash2, Key, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { useWebhookStore } from '@/stores/webhooks';
import { agentApi, webhookApi } from '@/services/api';
import Link from 'next/link';
import { WebhookTrigger, WebhookConfig } from '@/types';

export default function WebhooksPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    webhooks,
    loading,
    error,
    pagination,
    fetchWebhooks,
    deleteWebhook,
    updateWebhook,
    regenerateApiKey,
  } = useWebhookStore();

  useEffect(() => {
    fetchWebhooks({ page: 1, limit: 10 });
  }, [fetchWebhooks]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchWebhooks({ page: 1, limit: 10, search: query });
  };

  const handleToggleStatus = async (webhook: WebhookTrigger) => {
    try {
      await webhookApi.update(webhook._id, { isActive: !webhook.isActive });
      await fetchWebhooks();
      toast.success(`触发器已${webhook.isActive ? '禁用' : '启用'}`);
    } catch (error) {
      console.error('切换状态失败:', error);
      toast.error('切换状态失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个webhook触发器吗？')) return;
    
    try {
      await webhookApi.delete(id);
      await fetchWebhooks();
      toast.success('触发器删除成功');
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const handleRegenerateKey = async (id: string) => {
    if (!confirm('确定要重新生成API密钥吗？旧密钥将失效。')) return;
    
    try {
      await webhookApi.regenerateApiKey(id);
      await fetchWebhooks();
      toast.success('API密钥已重新生成');
    } catch (error) {
      console.error('重新生成密钥失败:', error);
      toast.error('重新生成密钥失败');
    }
  };

  const handlePageChange = (page: number) => {
    fetchWebhooks({ page, limit: pagination.limit, search: searchQuery });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return '';
    return apiKey.substring(0, 8) + '***';
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-500">加载失败: {error}</p>
          <Button onClick={() => fetchWebhooks()} className="mt-4">
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Webhook触发器</h1>
          <p className="text-muted-foreground">
            管理您的webhook触发器，自动化智能体工作流程
          </p>
        </div>
        <Button onClick={() => router.push('/projects/webhooks/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          创建触发器
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索触发器名称..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle>触发器列表</CardTitle>
          <CardDescription>
            共 {pagination.total} 个触发器
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">暂无webhook触发器</p>
              <Button onClick={() => router.push('/projects/webhooks/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                创建第一个触发器
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>HTTP方法</TableHead>
                  <TableHead>响应格式</TableHead>
                  <TableHead>API密钥</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link 
                            href={`/projects/webhooks/${webhook._id}`}
                            className="font-medium hover:underline"
                          >
                            {webhook.name}
                          </Link>
                          {webhook.description && (
                            <p className="text-sm text-muted-foreground">
                              {webhook.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    <TableCell>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {webhook.type === 'webhook' && webhook.config 
                          ? (webhook.config as WebhookConfig).httpMethod 
                          : webhook.httpMethod || 'POST'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {webhook.type === 'webhook' && webhook.config 
                          ? (webhook.config as WebhookConfig).responseFormat?.toUpperCase() 
                          : webhook.responseFormat?.toUpperCase() || 'JSON'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {maskApiKey(webhook.apiKey || '')}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.apiKey || '')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(webhook.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/projects/webhooks/${webhook._id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(webhook)}>
                            {webhook.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                禁用
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                启用
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRegenerateKey(webhook._id)}>
                            <Key className="h-4 w-4 mr-2" />
                            重新生成密钥
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(webhook._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                显示 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}