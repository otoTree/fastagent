'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, Pause, Key, Copy, RefreshCw, Activity, Clock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { webhookApi } from '@/services/api';
import { WebhookTrigger, WebhookConfig } from '@/types';

export default function WebhookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const webhookId = params.id as string;
  
  const [testData, setTestData] = useState('{}');
  const [testLoading, setTestLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const {
    currentWebhook,
    webhookLogs,
    loading,
    logsLoading,
    fetchWebhook,
    fetchWebhookLogs,
    updateWebhook,
    regenerateApiKey,
    triggerWebhook,
  } = useWebhookStore();

  useEffect(() => {
    if (webhookId) {
      fetchWebhook(webhookId);
      fetchWebhookLogs(webhookId);
    }
  }, [webhookId, fetchWebhook, fetchWebhookLogs]);

  const handleToggleStatus = async () => {
    if (!currentWebhook) return;
    
    try {
      await webhookApi.update(currentWebhook._id, { isActive: !currentWebhook.isActive });
      await fetchWebhook(webhookId);
      toast.success(`触发器已${currentWebhook.isActive ? '禁用' : '启用'}`);
    } catch (error) {
      console.error('更新状态失败:', error);
      toast.error('更新状态失败');
    }
  };

  const handleRegenerateKey = async () => {
    if (!currentWebhook) return;
    if (!confirm('确定要重新生成API密钥吗？旧密钥将失效。')) return;
    
    try {
      await webhookApi.regenerateApiKey(currentWebhook._id);
      await fetchWebhook(webhookId);
      toast.success('API密钥已重新生成');
    } catch (error) {
      console.error('重新生成密钥失败:', error);
      toast.error('重新生成密钥失败');
    }
  };

  const handleTestTrigger = async () => {
    if (!currentWebhook) return;
    
    try {
      setTestLoading(true);
      let data = {};
      
      if (testData.trim()) {
        try {
          data = JSON.parse(testData);
        } catch (e) {
          toast.error('测试数据格式错误，请输入有效的JSON');
          return;
        }
      }
      
      await webhookApi.triggerWebhook(currentWebhook._id, data);
      toast.success('触发器测试成功');
      
      // 刷新日志
      fetchWebhookLogs(webhookId);
    } catch (error) {
      console.error('触发器测试失败:', error);
      toast.error('触发器测试失败');
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return '';
    return apiKey.substring(0, 8) + '***';
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading || !currentWebhook) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/webhooks/${currentWebhook._id}/trigger`;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{currentWebhook.name}</h1>
            <Badge variant={currentWebhook.isActive ? 'default' : 'secondary'}>
              {currentWebhook.isActive ? '启用' : '禁用'}
            </Badge>
          </div>
          {currentWebhook.description && (
            <p className="text-muted-foreground mt-1">
              {currentWebhook.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            className="gap-2"
          >
            {currentWebhook.isActive ? (
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
            onClick={handleRegenerateKey}
            className="gap-2"
          >
            <Key className="h-4 w-4" />
            重新生成密钥
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="test">测试</TabsTrigger>
          <TabsTrigger value="logs">执行日志</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">触发器名称</Label>
                  <p className="text-sm text-muted-foreground mt-1">{currentWebhook.name}</p>
                </div>
                
                {currentWebhook.description && (
                  <div>
                    <Label className="text-sm font-medium">描述</Label>
                    <p className="text-sm text-muted-foreground mt-1">{currentWebhook.description}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">HTTP方法</Label>
                  <Badge variant="outline" className="mt-1">{currentWebhook.httpMethod}</Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">响应格式</Label>
                  <Badge variant="outline" className="mt-1">
                    {currentWebhook.responseFormat?.toUpperCase() || 
                     (currentWebhook.config as WebhookConfig)?.responseFormat?.toUpperCase() || 
                     'JSON'}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">创建时间</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(currentWebhook.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>配置信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">超时时间</Label>
                  <p className="text-sm text-muted-foreground mt-1">{(currentWebhook.timeout || 30000) / 1000}秒</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">重试次数</Label>
                  <p className="text-sm text-muted-foreground mt-1">{currentWebhook.retryCount || 3}次</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">重试延迟</Label>
                  <p className="text-sm text-muted-foreground mt-1">{(currentWebhook.retryDelay || 1000) / 1000}秒</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">状态</Label>
                  <Badge variant={currentWebhook.isActive ? 'default' : 'secondary'} className="mt-1">
                    {currentWebhook.isActive ? '启用' : '禁用'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Webhook URL */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook URL</CardTitle>
              <CardDescription>
                使用此URL来触发webhook，请在请求头中包含API密钥
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  复制
                </Button>
              </div>

              {/* API Key Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">API密钥</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={showApiKey ? currentWebhook.apiKey : maskApiKey(currentWebhook.apiKey)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="gap-2"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showApiKey ? '隐藏' : '显示'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentWebhook.apiKey)}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    复制
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  请妥善保管您的API密钥，不要在公开场所分享
                </p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">请求示例</h4>
                <pre className="text-sm text-muted-foreground">
{`curl -X ${currentWebhook.httpMethod} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${showApiKey ? currentWebhook.apiKey : 'YOUR_API_KEY'}" \\
  -d '{"message": "Hello World"}' \\
  ${webhookUrl}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>测试触发器</CardTitle>
              <CardDescription>
                发送测试请求来验证webhook触发器是否正常工作
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testData">测试数据 (JSON格式)</Label>
                <Textarea
                  id="testData"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  placeholder='{"message": "Hello World"}'
                  rows={6}
                  className="font-mono text-sm mt-2"
                />
              </div>
              
              <Button
                onClick={handleTestTrigger}
                disabled={testLoading || !currentWebhook.isActive}
                className="gap-2"
              >
                {testLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {testLoading ? '测试中...' : '发送测试请求'}
              </Button>
              
              {!currentWebhook.isActive && (
                <p className="text-sm text-muted-foreground">
                  触发器已禁用，请先启用后再进行测试
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>执行日志</CardTitle>
                  <CardDescription>
                    查看webhook触发器的执行历史和结果
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchWebhookLogs(webhookId)}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : webhookLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无执行日志</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>状态</TableHead>
                      <TableHead>执行时间</TableHead>
                      <TableHead>响应码</TableHead>
                      <TableHead>耗时</TableHead>
                      <TableHead>创建时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={log.success ? 'default' : 'destructive'}>
                              {log.success ? '成功' : '失败'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatExecutionTime(log.executionTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.statusCode}</Badge>
                        </TableCell>
                        <TableCell>
                          {formatExecutionTime(log.executionTime)}
                        </TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}