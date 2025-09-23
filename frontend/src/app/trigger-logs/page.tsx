'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { triggerLogApi } from '@/services/api';
import { TriggerLog } from '@/types';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

export default function TriggerLogsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<TriggerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    successRate: '0.00',
    avgExecutionTime: 0,
    statusStats: {} as Record<string, number>,
    dailyStats: [] as Array<{
      _id: string;
      count: number;
      successCount: number;
      failedCount: number;
    }>,
  });
  
  // 过滤器状态
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });
  
  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // 详情弹窗状态
  const [selectedLog, setSelectedLog] = useState<TriggerLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 检查用户认证
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await triggerLogApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取日志列表
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };
      
      const response = await triggerLogApi.getLogs(params);
      if (response.success && response.data) {
        setLogs(response.data);
        if (response.meta) {
          setPagination(prev => ({
            ...prev,
            total: response.meta?.total || 0,
            totalPages: response.meta?.totalPages || 0,
          }));
        }
      }
    } catch (error) {
      console.error('获取日志列表失败:', error);
      toast.error('获取日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    if (user) {
      fetchStats();
      fetchLogs();
    }
  }, [user, pagination.page, pagination.limit]);

  // 应用过滤器
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  // 查看详情
  const viewDetails = async (logId: string) => {
    try {
      const response = await triggerLogApi.getLog(logId);
      if (response.success && response.data) {
        setSelectedLog(response.data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('获取日志详情失败:', error);
      toast.error('获取日志详情失败');
    }
  };

  // 删除日志
  const deleteLog = async (logId: string) => {
    try {
      const response = await triggerLogApi.deleteLog(logId);
      if (response.success) {
        toast.success('删除成功');
        fetchLogs();
        fetchStats();
      }
    } catch (error) {
      console.error('删除日志失败:', error);
      toast.error('删除日志失败');
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <Play className="h-4 w-4" />;
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
      case 'error':
      case 'timeout':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
      case 'timeout':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString('zh-CN');
    } catch {
      return timeString;
    }
  };

  // 格式化持续时间
  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">触发器调用日志</h1>
          <p className="text-muted-foreground mt-1">
            查看和管理您的触发器调用记录
          </p>
        </div>
        <Button onClick={() => { fetchLogs(); fetchStats(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总调用次数</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功调用</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successCalls}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败调用</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedCalls}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均执行时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgExecutionTime)}ms</div>
          </CardContent>
        </Card>
      </div>

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            过滤器
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">状态</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending">等待中</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                  <SelectItem value="timeout">超时</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索触发器名称..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">开始时间</label>
              <Input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">结束时间</label>
              <Input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>
              应用过滤器
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>调用日志</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无日志记录
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className={`flex items-center gap-1 ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status === 'pending' && '等待中'}
                        {log.status === 'running' && '运行中'}
                        {log.status === 'completed' && '已完成'}
                        {log.status === 'success' && '成功'}
                        {log.status === 'failed' && '失败'}
                        {log.status === 'error' && '错误'}
                        {log.status === 'timeout' && '超时'}
                      </Badge>
                      
                      <div>
                        <div className="font-medium">
                          {log.trigger?.name || '未知触发器'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          项目: {log.project?.name || '未知项目'} | 
                          代理: {log.agent?.name || '未知代理'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div>开始: {formatTime(log.startTime)}</div>
                        <div className="text-muted-foreground">
                          耗时: {formatDuration(log.duration)}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDetails(log._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteLog(log._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {log.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      错误: {log.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                显示 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                共 {pagination.total} 条记录
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                
                <span className="text-sm">
                  第 {pagination.page} 页，共 {pagination.totalPages} 页
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">触发器</label>
                  <div className="mt-1">{selectedLog.trigger?.name || '未知触发器'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(selectedLog.status)}`}>
                      {selectedLog.status === 'pending' && '等待中'}
                      {selectedLog.status === 'running' && '运行中'}
                      {selectedLog.status === 'completed' && '已完成'}
                      {selectedLog.status === 'success' && '成功'}
                      {selectedLog.status === 'failed' && '失败'}
                      {selectedLog.status === 'error' && '错误'}
                      {selectedLog.status === 'timeout' && '超时'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">项目</label>
                  <div className="mt-1">{selectedLog.project?.name || '未知项目'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">代理</label>
                  <div className="mt-1">{selectedLog.agent?.name || '未知代理'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">开始时间</label>
                  <div className="mt-1">{formatTime(selectedLog.startTime)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">结束时间</label>
                  <div className="mt-1">{selectedLog.endTime ? formatTime(selectedLog.endTime) : '-'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">执行时长</label>
                  <div className="mt-1">{formatDuration(selectedLog.duration)}</div>
                </div>
              </div>

              {/* 请求数据 */}
              {selectedLog.requestData && (
                <div>
                  <label className="text-sm font-medium">请求数据</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.requestData, null, 2)}
                  </pre>
                </div>
              )}

              {/* 响应数据 */}
              {selectedLog.responseData && (
                <div>
                  <label className="text-sm font-medium">响应数据</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.responseData, null, 2)}
                  </pre>
                </div>
              )}

              {/* 错误信息 */}
              {selectedLog.errorMessage && (
                <div>
                  <label className="text-sm font-medium">错误信息</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}