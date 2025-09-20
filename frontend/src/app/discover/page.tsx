"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Globe, User, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types/agent";
import { agentApi } from "@/lib/api";
import { toast } from "sonner";

const DiscoverPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // 获取公开的agent列表
  const fetchPublicAgents = async (page = 1, search = "", tags: string[] = []) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(tags.length > 0 && { tags }),
      };

      const response = await agentApi.getPublicAgents(params);
      if (response.data.success) {
        setAgents(response.data.data.agents);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching public agents:", error);
      toast.error("获取公开智能体失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicAgents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublicAgents(1, searchTerm, selectedTags);
  };

  const handleTagClick = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    fetchPublicAgents(1, searchTerm, newTags);
  };

  const handlePageChange = (page: number) => {
    fetchPublicAgents(page, searchTerm, selectedTags);
  };

  // 获取所有标签用于筛选
  const allTags = Array.from(new Set((agents || []).flatMap(agent => agent.tags || []))).slice(0, 20);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 页面头部 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Globe className="h-8 w-8 text-blue-600" />
          发现智能体
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          探索社区创建的优秀AI智能体，找到适合你需求的助手
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="搜索智能体名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            搜索
          </Button>
        </form>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Filter className="h-4 w-4" />
              标签筛选:
            </span>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-blue-100"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 智能体网格 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      ) : (agents || []).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无公开智能体
            </h3>
            <p className="text-gray-600">
              {searchTerm || (selectedTags || []).length > 0 
                ? "没有找到符合条件的智能体，请尝试其他搜索条件" 
                : "还没有公开的智能体，成为第一个发布者吧！"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {agents.map((agent) => (
              <Card key={agent._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{agent.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {agent.description || "暂无描述"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* 标签 */}
                    {(agent.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(agent.tags || []).slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(agent.tags || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(agent.tags || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* 统计信息 */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {agent.owner.username}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {agent.usageCount} 次使用
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(agent.publishedAt!).toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {agent.modelName}
                      </Badge>
                    </div>

                    {/* 操作按钮 */}
                    <div className="pt-2">
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                          // TODO: 实现使用智能体的功能
                          toast.info("使用功能即将上线");
                        }}
                      >
                        使用此智能体
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                上一页
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverPage;