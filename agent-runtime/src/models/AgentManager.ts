import { EventEmitter } from 'events';
import { AgentExecutor } from './AgentExecutor';
import { AgentConfig, AgentInstance, AgentStatus } from '../types/agent';
import { Task, CreateTaskRequest, TaskType, TaskPriority } from '../types/task';
import { toolService } from '../services/toolService';
import { agentDatabaseService } from '../services/agentDatabase';
import { taskStatusService } from '../services/taskStatusService';

export class AgentManager extends EventEmitter {
  private agents: Map<string, AgentExecutor> = new Map();
  private agentConfigs: Map<string, AgentConfig> = new Map();

  constructor() {
    super();
  }

  // 注册Agent
  async registerAgent(config: AgentConfig): Promise<void> {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent with id ${config.id} already exists`);
    }

    const executor = new AgentExecutor(config);
    
    // 监听Agent事件
    executor.on('statusChanged', (status) => {
      this.emit('agentStatusChanged', config.id, status);
    });
    
    executor.on('taskCompleted', (task) => {
      this.emit('agentTaskCompleted', config.id, task);
    });
    
    executor.on('taskFailed', (task, error) => {
      this.emit('agentTaskFailed', config.id, task, error);
    });

    this.agents.set(config.id, executor);
    this.agentConfigs.set(config.id, config);
    
    this.emit('agentRegistered', config.id);
  }

  // 注销Agent
  async unregisterAgent(agentId: string): Promise<void> {
    const executor = this.agents.get(agentId);
    if (!executor) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    await executor.stop();
    this.agents.delete(agentId);
    this.agentConfigs.delete(agentId);
    
    this.emit('agentUnregistered', agentId);
  }

  // 获取Agent实例
  getAgent(agentId: string): AgentExecutor | undefined {
    return this.agents.get(agentId);
  }

  // 获取所有Agent
  getAllAgents(): AgentInstance[] {
    const instances: AgentInstance[] = [];
    
    for (const [agentId, executor] of this.agents) {
      const config = this.agentConfigs.get(agentId)!;
      const state = executor.getStatus();
      
      instances.push({
        config,
        state,
        createdAt: new Date(), // 应该从持久化存储获取
        updatedAt: new Date()
      });
    }
    
    return instances;
  }

  // 获取Agent状态
  getAgentStatus(agentId: string): AgentStatus | undefined {
    const executor = this.agents.get(agentId);
    return executor?.getStatus().status;
  }

  // 创建任务
  async createTask(request: CreateTaskRequest, userId: string): Promise<Task> {
    const executor = this.agents.get(request.agentId);
    if (!executor) {
      throw new Error(`Agent with id ${request.agentId} not found`);
    }

    const taskId = this.generateTaskId();
    const now = new Date();

    const task: Task = {
      id: taskId,
      input: {
        type: request.type,
        priority: request.priority || TaskPriority.MEDIUM,
        context: {
          userId,
          projectId: request.projectId,
          agentId: request.agentId,
          triggerId: request.triggerId
        },
        payload: request.payload,
        timeout: request.timeout || 300000,
        retryCount: 3,
        scheduledAt: request.scheduledAt
      },
      createdAt: now,
      updatedAt: now
    };

    // 如果是定时任务，需要调度
    if (request.scheduledAt && request.scheduledAt > now) {
      this.scheduleTask(task);
    } else {
      await executor.addTask(task);
    }

    this.emit('taskCreated', task);
    return task;
  }

  // 调度定时任务
  private scheduleTask(task: Task): void {
    const delay = task.input.scheduledAt!.getTime() - Date.now();
    
    setTimeout(async () => {
      const executor = this.agents.get(task.input.context.agentId);
      if (executor) {
        await executor.addTask(task);
      }
    }, delay);
  }

  // 生成任务ID
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取Agent统计信息
  getAgentStats(agentId: string): {
    status: AgentStatus;
    tasks: {
      queued: number;
      running: number;
      total: number;
      completed: number;
      failed: number;
    };
    metrics: {
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
      averageExecutionTime: number;
    };
  } | undefined {
    const executor = this.agents.get(agentId);
    if (!executor) {
      return undefined;
    }

    const state = executor.getStatus();
    const taskStats = executor.getTaskStats();

    return {
      status: state.status,
      tasks: taskStats,
      metrics: state.metrics
    };
  }

  // 获取所有Agent统计信息
  getAllAgentStats(): Record<string, ReturnType<typeof this.getAgentStats>> {
    const stats: Record<string, ReturnType<typeof this.getAgentStats>> = {};
    
    for (const agentId of this.agents.keys()) {
      stats[agentId] = this.getAgentStats(agentId);
    }
    
    return stats;
  }

  // 更新Agent配置
  async updateAgentConfig(agentId: string, updates: Partial<AgentConfig>): Promise<void> {
    const executor = this.agents.get(agentId);
    const config = this.agentConfigs.get(agentId);
    
    if (!executor || !config) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    const newConfig = { ...config, ...updates };
    executor.updateConfig(newConfig);
    this.agentConfigs.set(agentId, newConfig);
    
    this.emit('agentConfigUpdated', agentId, newConfig);
  }

  // 停止所有Agent
  async stopAllAgents(): Promise<void> {
    const stopPromises = Array.from(this.agents.values()).map(executor => executor.stop());
    await Promise.all(stopPromises);
    
    this.emit('allAgentsStopped');
  }

  // 健康检查
  async healthCheck(): Promise<{
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    busyAgents: number;
    errorAgents: number;
    offlineAgents: number;
  }> {
    const stats = {
      totalAgents: this.agents.size,
      activeAgents: 0,
      idleAgents: 0,
      busyAgents: 0,
      errorAgents: 0,
      offlineAgents: 0
    };

    for (const executor of this.agents.values()) {
      const status = executor.getStatus().status;
      
      switch (status) {
        case AgentStatus.IDLE:
          stats.idleAgents++;
          stats.activeAgents++;
          break;
        case AgentStatus.BUSY:
          stats.busyAgents++;
          stats.activeAgents++;
          break;
        case AgentStatus.ERROR:
          stats.errorAgents++;
          break;
        case AgentStatus.OFFLINE:
          stats.offlineAgents++;
          break;
      }
    }

    return stats;
  }

  // 执行任务 - 从backend接收任务执行请求
  async executeTask(request: {
    taskId: string;
    agentId: string;
    input: string;
    context?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
    timeout?: number;
  }): Promise<{
    taskId: string;
    status: 'started' | 'queued';
    message: string;
  }> {
    // 创建任务状态跟踪
    taskStatusService.createTaskStatus(request.taskId);

    // 首先从数据库获取agent配置
    await this.ensureAgentLoaded(request.agentId);
    
    const executor = this.agents.get(request.agentId);
    if (!executor) {
      taskStatusService.failTask(request.taskId, `Agent with id ${request.agentId} not found`);
      throw new Error(`Agent with id ${request.agentId} not found`);
    }

    // 创建任务
    const task: Task = {
      id: request.taskId,
      input: {
        type: TaskType.API, // 使用API类型表示从backend来的任务
        priority: this.mapPriority(request.priority || 'normal'),
        context: {
          agentId: request.agentId,
          projectId: 'system',
          userId: 'system',
          ...request.context
        },
        payload: { content: request.input },
        timeout: request.timeout || 300000,
        retryCount: 3
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 调度任务执行
    this.scheduleTask(task);
    
    return {
      taskId: request.taskId,
      status: 'queued',
      message: 'Task queued for execution'
    };
  }

  // 获取任务状态
  async getTaskStatus(taskId: string): Promise<{
    taskId: string;
    status: string;
    result?: any;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const taskStatus = taskStatusService.getTaskStatus(taskId);
    
    if (!taskStatus) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    return {
      taskId: taskStatus.taskId,
      status: taskStatus.status,
      result: taskStatus.result,
      error: taskStatus.error,
      createdAt: taskStatus.createdAt,
      updatedAt: taskStatus.updatedAt
    };
  }

  // 取消任务
  async cancelTask(taskId: string): Promise<void> {
    const taskStatus = taskStatusService.getTaskStatus(taskId);
    
    if (!taskStatus) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    if (['completed', 'failed', 'cancelled'].includes(taskStatus.status)) {
      throw new Error(`Task ${taskId} is already ${taskStatus.status}`);
    }

    taskStatusService.cancelTask(taskId);
    console.log(`Task ${taskId} has been cancelled`);
  }

  // 获取运行时状态
  async getRuntimeStatus(): Promise<{
    totalAgents: number;
    loadedAgents: number;
    activeTasks: number;
    queuedTasks: number;
    systemHealth: string;
  }> {
    const stats = await this.healthCheck();
    const taskStats = taskStatusService.getTaskStatistics();
    
    return {
      totalAgents: stats.totalAgents,
      loadedAgents: stats.activeAgents + stats.idleAgents,
      activeTasks: taskStats.running,
      queuedTasks: taskStats.pending,
      systemHealth: 'healthy'
    };
  }

  // 确保agent已加载，如果没有则从数据库加载
  private async ensureAgentLoaded(agentId: string): Promise<void> {
    if (this.agents.has(agentId)) {
      return;
    }

    // 从数据库加载agent配置
    const agentConfig = await this.loadAgentFromDatabase(agentId);
    if (agentConfig) {
      await this.registerAgent(agentConfig);
    } else {
      throw new Error(`Agent configuration not found for id: ${agentId}`);
    }
  }

  // 从数据库加载agent配置
  private async loadAgentFromDatabase(agentId: string): Promise<AgentConfig | null> {
    try {
      return await agentDatabaseService.loadAgentConfig(agentId);
    } catch (error) {
      console.error(`Failed to load agent ${agentId} from database:`, error);
      return null;
    }
  }

  // 映射优先级
  private mapPriority(priority: string): TaskPriority {
    switch (priority) {
      case 'low': return TaskPriority.LOW;
      case 'high': return TaskPriority.HIGH;
      default: return TaskPriority.MEDIUM;
    }
  }

  // 从backend同步Agent配置
  async syncAgentFromBackend(agentData: {
    id: string;
    name: string;
    description?: string;
    prompt: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    capabilities: string[];
  }): Promise<void> {
    const config: AgentConfig = {
      id: agentData.id,
      name: agentData.name,
      description: agentData.description,
      prompt: agentData.prompt,
      modelName: agentData.modelName,
      temperature: agentData.temperature,
      maxTokens: agentData.maxTokens,
      capabilities: agentData.capabilities,
      tools: [], // 从capabilities推导或单独配置
      maxConcurrentTasks: 5,
      timeout: 300000
    };

    if (this.agents.has(config.id)) {
      await this.updateAgentConfig(config.id, config);
    } else {
      await this.registerAgent(config);
    }
  }
}