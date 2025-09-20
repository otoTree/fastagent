"use client";

import { Bot, Eye, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { AgentCardProps } from "@/types/agent";

export const AgentCard = ({ 
  agent, 
  onDelete, 
  token, 
  onUpdate 
}: AgentCardProps) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/agents/editor?id=${agent._id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <CardDescription className="text-sm">
                模型: {agent.modelName} | 温度: {agent.temperature} | 使用次数: {agent.usageCount}
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                创建于: {new Date(agent.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    您确定要删除智能体 &quot;{agent.name}&quot; 吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(agent._id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
          {agent.description || "暂无描述"}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {(agent.tags || []).slice(0, 3).map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {(agent.tags || []).length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(agent.tags || []).length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>创建于 {new Date(agent.createdAt).toLocaleDateString()}</span>
          {agent.isPublic && (
            <Badge variant="outline" className="text-xs">
              公开
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};