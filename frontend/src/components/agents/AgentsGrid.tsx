"use client";

import { Plus, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { AgentCard } from "./AgentCard";
import { AgentsGridProps } from "@/types/agent";

export const AgentsGrid = ({
  agents,
  onDelete,
  token,
  onUpdate,
  onCreateAgent
}: AgentsGridProps) => {
  if ((agents || []).length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            暂无智能体
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            开始创建您的第一个AI智能体
          </p>
          <Button onClick={onCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            创建智能体
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <AgentCard
          key={agent._id}
          agent={agent}
          onDelete={onDelete}
          token={token}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};