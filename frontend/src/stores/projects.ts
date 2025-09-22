import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types';
import { projectApi } from '@/services/api';

interface ProjectState {
  // 状态
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  // 分页状态
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // 搜索和过滤
  searchQuery: string;
  selectedAgentId: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  setPagination: (pagination: Partial<ProjectState['pagination']>) => void;

  // API Actions
  fetchProjects: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    agentId?: string;
  }) => Promise<void>;
  
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  
  // 本地状态更新
  addProject: (project: Project) => void;
  updateProjectInList: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  
  // 重置状态
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  searchQuery: '',
  selectedAgentId: null,
};

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 基础状态设置
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
      setPagination: (pagination) => 
        set((state) => ({ 
          pagination: { ...state.pagination, ...pagination } 
        })),

      // API Actions
      fetchProjects: async (params) => {
        set({ loading: true, error: null });
        try {
          const response = await projectApi.getProjects(params);
          if (response.success && response.data) {
            set({ 
              projects: response.data,
              loading: false,
              pagination: {
                page: params?.page || 1,
                limit: params?.limit || 10,
                total: response.meta?.total || 0,
                totalPages: response.meta?.totalPages || Math.ceil((response.meta?.total || 0) / (params?.limit || 10)),
              }
            });
          } else {
            set({ 
              error: response.error?.message || '获取项目列表失败',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取项目列表失败',
            loading: false 
          });
        }
      },

      fetchProject: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await projectApi.getProject(id);
          if (response.success && response.data) {
            set({ 
              currentProject: response.data,
              loading: false 
            });
          } else {
            set({ 
              error: response.error?.message || '获取项目详情失败',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取项目详情失败',
            loading: false 
          });
        }
      },

      createProject: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await projectApi.createProject(data);
          if (response.success && response.data) {
            const newProject = response.data;
            set((state) => ({ 
              projects: [newProject, ...state.projects],
              loading: false 
            }));
            return newProject;
          } else {
            const error = response.error?.message || '创建项目失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '创建项目失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      updateProject: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const response = await projectApi.updateProject(id, data);
          if (response.success && response.data) {
            const updatedProject = response.data;
            set((state) => ({
              projects: state.projects.map(p => 
                p._id === id ? updatedProject : p
              ),
              currentProject: state.currentProject?._id === id 
                ? updatedProject 
                : state.currentProject,
              loading: false
            }));
            return updatedProject;
          } else {
            const error = response.error?.message || '更新项目失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '更新项目失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      deleteProject: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await projectApi.deleteProject(id);
          if (response.success) {
            set((state) => ({
              projects: state.projects.filter(p => p._id !== id),
              currentProject: state.currentProject?._id === id 
                ? null 
                : state.currentProject,
              loading: false
            }));
          } else {
            const error = response.error?.message || '删除项目失败';
            set({ error, loading: false });
            throw new Error(error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '删除项目失败';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // 本地状态更新
      addProject: (project) => 
        set((state) => ({ 
          projects: [project, ...state.projects] 
        })),

      updateProjectInList: (id, updates) =>
        set((state) => ({
          projects: state.projects.map(p => 
            p._id === id ? { ...p, ...updates } : p
          ),
          currentProject: state.currentProject?._id === id 
            ? { ...state.currentProject, ...updates }
            : state.currentProject
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter(p => p._id !== id),
          currentProject: state.currentProject?._id === id 
            ? null 
            : state.currentProject
        })),

      setCurrentProject: (project) => set({ currentProject: project }),

      // 重置状态
      reset: () => set(initialState),
    }),
    {
      name: 'project-store',
    }
  )
);