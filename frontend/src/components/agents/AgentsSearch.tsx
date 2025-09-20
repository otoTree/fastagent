"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { AgentsSearchProps } from "@/types/agent";

export const AgentsSearch = ({
  searchTerm,
  onSearchChange,
  onSearch
}: AgentsSearchProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={onSearch} className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="搜索智能体名称或描述..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};