'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, ExternalLink, Star, DollarSign } from 'lucide-react';
import { getPluginList, getPluginTypes } from '@/lib/plugin-api';
import { ToolListItem, ToolType, ToolTypeEnum, I18nString } from '@/types/plugin';

const PluginsPage = () => {
  const [plugins, setPlugins] = useState<ToolListItem[]>([]);
  const [pluginTypes, setPluginTypes] = useState<ToolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // 获取插件数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pluginsData, typesData] = await Promise.all([
          getPluginList(),
          getPluginTypes()
        ]);
        setPlugins(pluginsData);
        setPluginTypes(typesData);
      } catch (err) {
        setError('获取插件数据失败，请稍后重试');
        console.error('Error fetching plugins:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 过滤插件
  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch = plugin.name['zh-CN'].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description['zh-CN'].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || plugin.templateType === selectedType;
    const matchesActive = !showActiveOnly || plugin.isActive;
    
    return matchesSearch && matchesType && matchesActive;
  });

  // 获取本地化文本
  const getLocalizedText = (i18nText: I18nString | undefined) => {
    if (!i18nText) return '';
    return i18nText['zh-CN'] || i18nText.en || '';
  };

  // 获取完整的图片 URL
  const getImageUrl = (avatar: string) => {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:3030${avatar}`;
  };

  // 获取类型颜色
  const getTypeColor = (type: ToolTypeEnum) => {
    const colors = {
      [ToolTypeEnum.tools]: 'bg-blue-100 text-blue-800',
      [ToolTypeEnum.search]: 'bg-green-100 text-green-800',
      [ToolTypeEnum.multimodal]: 'bg-purple-100 text-purple-800',
      [ToolTypeEnum.communication]: 'bg-orange-100 text-orange-800',
      [ToolTypeEnum.finance]: 'bg-yellow-100 text-yellow-800',
      [ToolTypeEnum.design]: 'bg-pink-100 text-pink-800',
      [ToolTypeEnum.productivity]: 'bg-indigo-100 text-indigo-800',
      [ToolTypeEnum.news]: 'bg-red-100 text-red-800',
      [ToolTypeEnum.entertainment]: 'bg-cyan-100 text-cyan-800',
      [ToolTypeEnum.social]: 'bg-teal-100 text-teal-800',
      [ToolTypeEnum.scientific]: 'bg-emerald-100 text-emerald-800',
      [ToolTypeEnum.other]: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors[ToolTypeEnum.other];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">插件市场</h1>
        <p className="text-lg text-gray-600">
          发现和使用各种强大的 AI 插件，提升您的工作效率
        </p>
      </div>

      {/* 搜索和过滤器 */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索插件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有类型</SelectItem>
              {pluginTypes.map((type) => (
                <SelectItem key={type.type} value={type.type}>
                  {getLocalizedText(type.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showActiveOnly ? "default" : "outline"}
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className="w-full sm:w-auto"
          >
            仅显示活跃插件
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          找到 {filteredPlugins.length} 个插件
          {selectedType !== 'all' && ` (${getLocalizedText(pluginTypes.find(t => t.type === selectedType)?.name)})`}
        </p>
      </div>

      {/* 插件网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map((plugin) => (
          <Card key={plugin.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {plugin.avatar && (
                    <img
                      src={getImageUrl(plugin.avatar)}
                      alt={getLocalizedText(plugin.name)}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {getLocalizedText(plugin.name)}
                    </CardTitle>
                    {plugin.author && (
                      <p className="text-sm text-gray-500">by {plugin.author}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {!plugin.isActive && (
                    <Badge variant="secondary">未激活</Badge>
                  )}
                  <Badge className={getTypeColor(plugin.templateType)}>
                    {getLocalizedText(pluginTypes.find(t => t.type === plugin.templateType)?.name)}
                  </Badge>
                </div>
              </div>
              <CardDescription className="mt-2">
                {getLocalizedText(plugin.description)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* 版本信息 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">版本:</span>
                  <Badge variant="outline">
                    {plugin.versionList[0]?.value || 'N/A'}
                  </Badge>
                </div>

                {/* 费用信息 */}
                {plugin.hasTokenFee && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      费用:
                    </span>
                    <div className="text-right">
                      {plugin.originCost !== plugin.currentCost && (
                        <span className="line-through text-gray-400 mr-2">
                          ¥{plugin.originCost}
                        </span>
                      )}
                      <span className="font-medium">¥{plugin.currentCost}</span>
                    </div>
                  </div>
                )}

                {/* 权重/评分 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    权重:
                  </span>
                  <span className="font-medium">{plugin.weight}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="flex-1">
                    {plugin.isActive ? '使用插件' : '激活插件'}
                  </Button>
                  {plugin.courseUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={plugin.courseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的插件</h3>
          <p className="text-gray-600">
            尝试调整搜索条件或浏览其他类型的插件
          </p>
        </div>
      )}
    </div>
  );
};

export default PluginsPage;