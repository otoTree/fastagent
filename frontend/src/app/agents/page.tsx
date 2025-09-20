"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/stores/auth";
import { AgentsGrid } from "@/components/agents/AgentsGrid";
import { AgentsSearch } from "@/components/agents/AgentsSearch";
import { Agent, AgentsResponse } from "@/types/agent";

export default function AgentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchAgents();
  }, [isAuthenticated, router, currentPage, searchTerm]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      });
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`http://localhost:4001/api/agents?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: AgentsResponse = await response.json();
        setAgents(data.data.agents);
        setTotalPages(data.data.pagination.pages);
      } else {
        console.error("Failed to fetch agents");
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`http://localhost:4001/api/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAgents(agents.filter(agent => agent._id !== agentId));
      } else {
        console.error("Failed to delete agent");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAgents();
  };

  if (loading && (agents || []).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              我的智能体
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              管理和配置您的AI智能体
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              onClick={() => router.push('/agents/editor')}
            >
              <Plus className="h-4 w-4 mr-2" />
              创建智能体
            </Button>
          </div>
        </div>

        {/* Search */}
        <AgentsSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />

        {/* Agents Grid */}
        <AgentsGrid
          agents={agents}
          onDelete={handleDeleteAgent}
          token={token}
          onUpdate={fetchAgents}
          onCreateAgent={() => router.push('/agents/editor')}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-600">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}