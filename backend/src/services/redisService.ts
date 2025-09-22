import Redis from 'ioredis';
import { 
  RedisTask, 
  AgentRegistration, 
  AgentHeartbeat, 
  TaskResult,
  TaskStatus,
  TaskPriority,
  AgentStatus,
  REDIS_KEYS 
} from '../types/redis';
import { 
  CreateTaskRequest, 
  TaskResponse, 
  TaskStatusResponse,
  BatchTaskRequest,
  BatchTaskResponse 
} from '../types/task';
import { 
  AgentRuntimeRegistration, 
  AgentRuntimeStatusUpdate,
  AgentRuntimeInfo 
} from '../types/agent';

class RedisService {
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';
    
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  // 连接Redis
  async connect(): Promise<void> {
    await Promise.all([
      this.redis.connect(),
      this.subscriber.connect(),
      this.publisher.connect()
    ]);
  }

  // 断开连接
  async disconnect(): Promise<void> {
    await Promise.all([
      this.redis.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect()
    ]);
  }

  // ==================== 任务队列操作 ====================

  // 创建任务
  async createTask(request: CreateTaskRequest, userId: string): Promise<TaskResponse> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const task: RedisTask = {
      id: taskId,
      agentId: request.agentId,
      triggerType: request.triggerType,
      triggerId: request.triggerId,
      priority: request.priority || TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      input: request.input,
      metadata: {
        userId,
        projectId: request.metadata?.projectId,
        source: request.metadata?.source || 'api',
        timeout: request.metadata?.timeout || 300000, // 5分钟默认
        retryCount: 0,
        maxRetries: request.metadata?.maxRetries || 3
      },
      timestamps: {
        createdAt: now,
        updatedAt: now
      }
    };

    // 使用事务确保原子性
    const multi = this.redis.multi();
    
    // 保存任务数据
    multi.hset(REDIS_KEYS.TASK_DATA(taskId), task);
    
    // 根据优先级添加到队列
    const priority = this.getPriorityScore(task.priority);
    multi.zadd(REDIS_KEYS.TASK_QUEUE, priority, taskId);
    
    // 更新统计
    multi.hincrby(REDIS_KEYS.STATS_TASKS, 'total', 1);
    multi.hincrby(REDIS_KEYS.STATS_TASKS, 'pending', 1);

    await multi.exec();

    // 发布任务创建事件
    await this.publisher.publish('task:created', JSON.stringify({
      taskId,
      agentId: request.agentId,
      priority: task.priority
    }));

    return {
      id: taskId,
      status: TaskStatus.PENDING,
      createdAt: now
    };
  }

  // 批量创建任务
  async createBatchTasks(request: BatchTaskRequest, userId: string): Promise<BatchTaskResponse> {
    const batchId = request.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const taskIds: string[] = [];
    const now = Date.now();

    const multi = this.redis.multi();

    for (const taskRequest of request.tasks) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      taskIds.push(taskId);

      const task: RedisTask = {
        id: taskId,
        agentId: taskRequest.agentId,
        triggerType: taskRequest.triggerType,
        triggerId: taskRequest.triggerId,
        priority: request.priority || taskRequest.priority || TaskPriority.NORMAL,
        status: TaskStatus.PENDING,
        input: taskRequest.input,
        metadata: {
          userId,
          projectId: taskRequest.metadata?.projectId,
          source: request.metadata?.source || taskRequest.metadata?.source || 'batch',
          timeout: taskRequest.metadata?.timeout || 300000,
          retryCount: 0,
          maxRetries: taskRequest.metadata?.maxRetries || 3
        },
        timestamps: {
          createdAt: now,
          updatedAt: now
        }
      };

      multi.hset(REDIS_KEYS.TASK_DATA(taskId), task);
      
      const priority = this.getPriorityScore(task.priority);
      multi.zadd(REDIS_KEYS.TASK_QUEUE, priority, taskId);
    }

    // 更新统计
    multi.hincrby(REDIS_KEYS.STATS_TASKS, 'total', request.tasks.length);
    multi.hincrby(REDIS_KEYS.STATS_TASKS, 'pending', request.tasks.length);

    await multi.exec();

    return {
      batchId,
      taskIds,
      totalTasks: request.tasks.length,
      createdAt: now
    };
  }

  // 获取下一个任务（Agent Runtime调用）
  async getNextTask(agentId: string): Promise<RedisTask | null> {
    // 使用BZPOPMAX阻塞式获取最高优先级任务
    const result = await this.redis.bzpopmax(REDIS_KEYS.TASK_QUEUE, 5); // 5秒超时
    
    if (!result) {
      return null;
    }

    const [, taskId] = result;
    
    // 获取任务详情
    const taskData = await this.redis.hgetall(REDIS_KEYS.TASK_DATA(taskId));
    
    if (!taskData || Object.keys(taskData).length === 0) {
      return null;
    }

    const task = this.parseRedisTask(taskData);
    
    // 检查任务是否属于该Agent
    if (task.agentId !== agentId) {
      // 如果不匹配，重新放回队列
      const priority = this.getPriorityScore(task.priority);
      await this.redis.zadd(REDIS_KEYS.TASK_QUEUE, priority, taskId);
      return null;
    }

    // 标记任务为处理中
    await this.updateTaskStatus(taskId, TaskStatus.PROCESSING);
    
    return task;
  }

  // 更新任务状态
  async updateTaskStatus(taskId: string, status: TaskStatus, result?: Partial<TaskResult>): Promise<void> {
    const now = Date.now();
    const multi = this.redis.multi();

    // 更新任务状态
    multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'status', status);
    multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'timestamps.updatedAt', now);

    if (status === TaskStatus.PROCESSING) {
      multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'timestamps.startedAt', now);
      multi.zadd(REDIS_KEYS.TASK_PROCESSING, now, taskId);
      // 更新统计
      multi.hincrby(REDIS_KEYS.STATS_TASKS, 'pending', -1);
      multi.hincrby(REDIS_KEYS.STATS_TASKS, 'processing', 1);
    } else if (status === TaskStatus.COMPLETED) {
      multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'timestamps.completedAt', now);
      multi.zrem(REDIS_KEYS.TASK_PROCESSING, taskId);
      multi.zadd(REDIS_KEYS.TASK_COMPLETED, now, taskId);
      // 更新统计
      multi.hincrby(REDIS_KEYS.STATS_TASKS, 'processing', -1);
      multi.hincrby(REDIS_KEYS.STATS_TASKS, 'completed', 1);
    } else if (status === TaskStatus.FAILED) {
      multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'timestamps.completedAt', now);
      multi.zrem(REDIS_KEYS.TASK_PROCESSING, taskId);
      multi.zadd(REDIS_KEYS.TASK_FAILED, now, taskId);
      // 更新统计
      multi.hincrby(REDIS_KEYS.STATS_TASKS, 'processing', -1);
      multi.hincrby(REDIS_KEYS.STATS_TASKS, 'failed', 1);
    }

    // 更新结果数据
    if (result) {
      if (result.output) {
        multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'result.output', JSON.stringify(result.output));
      }
      if (result.error) {
        multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'result.error', result.error);
      }
      if (result.executionTime) {
        multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'result.executionTime', result.executionTime);
      }
      if (result.tokens) {
        multi.hset(REDIS_KEYS.TASK_DATA(taskId), 'result.tokens', JSON.stringify(result.tokens));
      }
    }

    await multi.exec();

    // 发布状态更新事件
    await this.publisher.publish('task:status_updated', JSON.stringify({
      taskId,
      status,
      timestamp: now
    }));
  }

  // 获取任务状态
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse | null> {
    const taskData = await this.redis.hgetall(REDIS_KEYS.TASK_DATA(taskId));
    
    if (!taskData || Object.keys(taskData).length === 0) {
      return null;
    }

    const task = this.parseRedisTask(taskData);
    
    return {
      id: task.id,
      agentId: task.agentId,
      status: task.status,
      input: task.input,
      result: task.result,
      timestamps: task.timestamps
    };
  }

  // ==================== Agent管理操作 ====================

  // 注册Agent Runtime
  async registerAgentRuntime(registration: AgentRuntimeRegistration): Promise<void> {
    const now = Date.now();
    
    const agentInfo: AgentRegistration = {
      id: registration.agentId,
      runtimeId: registration.runtimeId,
      name: registration.name,
      description: registration.description,
      capabilities: registration.capabilities,
      status: AgentStatus.ONLINE,
      metadata: {
        ...registration.metadata,
        startedAt: now
      },
      performance: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0
      },
      heartbeat: {
        lastHeartbeatAt: now,
        interval: registration.config?.heartbeatInterval || 30000
      }
    };

    await this.redis.hset(REDIS_KEYS.AGENT_REGISTRY, registration.runtimeId, JSON.stringify(agentInfo));
    
    // 发布Agent注册事件
    await this.publisher.publish('agent:registered', JSON.stringify({
      runtimeId: registration.runtimeId,
      agentId: registration.agentId,
      timestamp: now
    }));
  }

  // 更新Agent心跳
  async updateAgentHeartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    const agentData = await this.redis.hget(REDIS_KEYS.AGENT_REGISTRY, heartbeat.runtimeId);
    
    if (!agentData) {
      throw new Error(`Agent runtime ${heartbeat.runtimeId} not found`);
    }

    const agent: AgentRegistration = JSON.parse(agentData);
    agent.heartbeat.lastHeartbeatAt = heartbeat.timestamp;
    agent.status = heartbeat.status;

    await this.redis.hset(REDIS_KEYS.AGENT_REGISTRY, heartbeat.runtimeId, JSON.stringify(agent));
    await this.redis.setex(REDIS_KEYS.AGENT_HEARTBEAT(heartbeat.agentId), 60, JSON.stringify(heartbeat));
  }

  // 获取Agent信息
  async getAgentInfo(runtimeId: string): Promise<AgentRuntimeInfo | null> {
    const agentData = await this.redis.hget(REDIS_KEYS.AGENT_REGISTRY, runtimeId);
    
    if (!agentData) {
      return null;
    }

    const agent: AgentRegistration = JSON.parse(agentData);
    
    return {
      runtimeId: agent.runtimeId,
      agentId: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      capabilities: agent.capabilities,
      metadata: agent.metadata,
      performance: agent.performance,
      heartbeat: agent.heartbeat
    };
  }

  // 获取所有在线Agent
  async getOnlineAgents(): Promise<AgentRuntimeInfo[]> {
    const agentData = await this.redis.hgetall(REDIS_KEYS.AGENT_REGISTRY);
    const agents: AgentRuntimeInfo[] = [];

    for (const [runtimeId, data] of Object.entries(agentData)) {
      const agent: AgentRegistration = JSON.parse(data);
      
      // 检查心跳是否过期
      const now = Date.now();
      const heartbeatTimeout = agent.heartbeat.interval * 2; // 2倍心跳间隔作为超时
      
      if (now - agent.heartbeat.lastHeartbeatAt > heartbeatTimeout) {
        agent.status = AgentStatus.OFFLINE;
        await this.redis.hset(REDIS_KEYS.AGENT_REGISTRY, runtimeId, JSON.stringify(agent));
      }

      agents.push({
        runtimeId: agent.runtimeId,
        agentId: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        capabilities: agent.capabilities,
        metadata: agent.metadata,
        performance: agent.performance,
        heartbeat: agent.heartbeat
      });
    }

    return agents;
  }

  // ==================== 工具方法 ====================

  // 获取优先级分数（用于Redis有序集合）
  private getPriorityScore(priority: TaskPriority): number {
    const scores = {
      [TaskPriority.LOW]: 1,
      [TaskPriority.NORMAL]: 2,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.URGENT]: 4
    };
    return scores[priority] || 2;
  }

  // 解析Redis任务数据
  private parseRedisTask(data: Record<string, string>): RedisTask {
    const result: any = {};
    
    // 解析嵌套的result对象
    if (data['result.output']) {
      result.output = JSON.parse(data['result.output']);
    }
    if (data['result.error']) {
      result.error = data['result.error'];
    }
    if (data['result.executionTime']) {
      result.executionTime = parseInt(data['result.executionTime']);
    }
    if (data['result.tokens']) {
      result.tokens = JSON.parse(data['result.tokens']);
    }

    // 解析嵌套的timestamps对象
    const timestamps: any = {};
    if (data['timestamps.createdAt']) {
      timestamps.createdAt = parseInt(data['timestamps.createdAt']);
    }
    if (data['timestamps.updatedAt']) {
      timestamps.updatedAt = parseInt(data['timestamps.updatedAt']);
    }
    if (data['timestamps.startedAt']) {
      timestamps.startedAt = parseInt(data['timestamps.startedAt']);
    }
    if (data['timestamps.completedAt']) {
      timestamps.completedAt = parseInt(data['timestamps.completedAt']);
    }

    return {
      id: data.id,
      agentId: data.agentId,
      triggerType: data.triggerType as any,
      triggerId: data.triggerId,
      priority: data.priority as TaskPriority,
      status: data.status as TaskStatus,
      input: JSON.parse(data.input || '{}'),
      metadata: JSON.parse(data.metadata || '{}'),
      result: Object.keys(result).length > 0 ? result : undefined,
      timestamps
    };
  }

  // 清理过期任务
  async cleanupExpiredTasks(): Promise<void> {
    const now = Date.now();
    const expiredTime = now - 24 * 60 * 60 * 1000; // 24小时前

    // 清理已完成的任务
    await this.redis.zremrangebyscore(REDIS_KEYS.TASK_COMPLETED, 0, expiredTime);
    
    // 清理失败的任务
    await this.redis.zremrangebyscore(REDIS_KEYS.TASK_FAILED, 0, expiredTime);
  }

  // 获取任务统计
  async getTaskStats(): Promise<any> {
    return await this.redis.hgetall(REDIS_KEYS.STATS_TASKS);
  }
}

export const redisService = new RedisService();
export default redisService;