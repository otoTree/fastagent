import Redis from 'ioredis';
import { RedisTask, TaskStatus, TaskPriority, TriggerType, REDIS_KEYS } from '../types/redis';
import { v4 as uuidv4 } from 'uuid';

export class RedisTaskService {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    
    this.redis.on('connect', () => {
      this.isConnected = true;
      console.log('Backend Redis连接成功');
    });
    
    this.redis.on('error', (error) => {
      console.error('Backend Redis连接错误:', error);
      this.isConnected = false;
    });
  }

  // 连接到Redis
  async connect(): Promise<void> {
    if (this.isConnected || this.redis.status === 'connecting' || this.redis.status === 'ready') {
      return;
    }
    
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Backend Redis连接失败:', error);
      throw error;
    }
  }

  // 断开Redis连接
  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  // 创建任务并发送到Redis队列
  async createTask(taskData: {
    agentId: string;
    triggerType: TriggerType;
    triggerId?: string;
    priority?: TaskPriority;
    input: {
      prompt?: string;
      data?: any;
      context?: Record<string, any>;
    };
    metadata: {
      userId: string;
      projectId?: string;
      source: string;
      timeout?: number;
      maxRetries?: number;
    };
  }): Promise<string> {
    const taskId = uuidv4();
    const now = Date.now();

    const task: RedisTask = {
      id: taskId,
      agentId: taskData.agentId,
      triggerType: taskData.triggerType,
      triggerId: taskData.triggerId,
      priority: taskData.priority || TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      input: taskData.input,
      metadata: {
        userId: taskData.metadata.userId,
        projectId: taskData.metadata.projectId,
        source: taskData.metadata.source,
        timeout: taskData.metadata.timeout || 300000, // 5分钟默认超时
        retryCount: 0,
        maxRetries: taskData.metadata.maxRetries || 3
      },
      timestamps: {
        createdAt: now,
        updatedAt: now
      }
    };

    // 将任务数据存储到Redis
    await this.redis.set(REDIS_KEYS.TASK_DATA(taskId), JSON.stringify(task));

    // 将任务ID添加到队列
    await this.redis.lpush(REDIS_KEYS.TASK_QUEUE, JSON.stringify(task));

    // 更新统计
    await this.redis.hincrby(REDIS_KEYS.STATS_TASKS, 'pending', 1);
    await this.redis.hincrby(REDIS_KEYS.STATS_TASKS, 'total', 1);

    console.log(`任务 ${taskId} 已创建并添加到队列`);
    return taskId;
  }

  // 批量创建任务
  async createTasks(tasksData: Array<{
    agentId: string;
    triggerType: TriggerType;
    triggerId?: string;
    priority?: TaskPriority;
    input: {
      prompt?: string;
      data?: any;
      context?: Record<string, any>;
    };
    metadata: {
      userId: string;
      projectId?: string;
      source: string;
      timeout?: number;
      maxRetries?: number;
    };
  }>): Promise<string[]> {
    const taskIds: string[] = [];
    const pipeline = this.redis.pipeline();

    for (const taskData of tasksData) {
      const taskId = uuidv4();
      const now = Date.now();

      const task: RedisTask = {
        id: taskId,
        agentId: taskData.agentId,
        triggerType: taskData.triggerType,
        triggerId: taskData.triggerId,
        priority: taskData.priority || TaskPriority.NORMAL,
        status: TaskStatus.PENDING,
        input: taskData.input,
        metadata: {
          userId: taskData.metadata.userId,
          projectId: taskData.metadata.projectId,
          source: taskData.metadata.source,
          timeout: taskData.metadata.timeout || 300000,
          retryCount: 0,
          maxRetries: taskData.metadata.maxRetries || 3
        },
        timestamps: {
          createdAt: now,
          updatedAt: now
        }
      };

      // 添加到pipeline
      pipeline.set(REDIS_KEYS.TASK_DATA(taskId), JSON.stringify(task));
      pipeline.lpush(REDIS_KEYS.TASK_QUEUE, JSON.stringify(task));
      
      taskIds.push(taskId);
    }

    // 更新统计
    pipeline.hincrby(REDIS_KEYS.STATS_TASKS, 'pending', tasksData.length);
    pipeline.hincrby(REDIS_KEYS.STATS_TASKS, 'total', tasksData.length);

    // 执行批量操作
    await pipeline.exec();

    console.log(`批量创建了 ${taskIds.length} 个任务`);
    return taskIds;
  }

  // 获取任务状态
  async getTaskStatus(taskId: string): Promise<RedisTask | null> {
    const taskData = await this.redis.get(REDIS_KEYS.TASK_DATA(taskId));
    return taskData ? JSON.parse(taskData) : null;
  }

  // 获取任务统计
  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const stats = await this.redis.hgetall(REDIS_KEYS.STATS_TASKS);
    
    return {
      total: parseInt(stats.total || '0'),
      pending: parseInt(stats.pending || '0'),
      processing: parseInt(stats.processing || '0'),
      completed: parseInt(stats.completed || '0'),
      failed: parseInt(stats.failed || '0')
    };
  }

  // 获取队列大小
  async getQueueSize(): Promise<number> {
    return await this.redis.llen(REDIS_KEYS.TASK_QUEUE);
  }

  // 获取在线Agent列表
  async getOnlineAgents(): Promise<string[]> {
    const allAgents = await this.redis.hgetall(REDIS_KEYS.AGENT_REGISTRY);
    const onlineAgents: string[] = [];
    const now = Date.now();

    for (const [agentId, agentData] of Object.entries(allAgents)) {
      try {
        const agent = JSON.parse(agentData);
        const heartbeatAge = now - agent.heartbeat.lastHeartbeatAt;
        
        // 检查心跳是否在有效期内（5分钟）
        if (heartbeatAge < 300000) {
          onlineAgents.push(agentId);
        }
      } catch (error) {
        console.error(`解析Agent数据失败: ${agentId}`, error);
      }
    }

    return onlineAgents;
  }

  // 检查Agent是否在线
  async isAgentOnline(agentId: string): Promise<boolean> {
    const agentData = await this.redis.hget(REDIS_KEYS.AGENT_REGISTRY, agentId);
    if (!agentData) return false;

    try {
      const agent = JSON.parse(agentData);
      const now = Date.now();
      const heartbeatAge = now - agent.heartbeat.lastHeartbeatAt;
      
      return heartbeatAge < 300000; // 5分钟内有心跳认为在线
    } catch (error) {
      console.error(`检查Agent在线状态失败: ${agentId}`, error);
      return false;
    }
  }

  // 清理过期任务
  async cleanupExpiredTasks(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    // 获取所有处理中的任务
    const processingTasks = await this.redis.lrange(REDIS_KEYS.TASK_PROCESSING, 0, -1);
    
    for (const taskData of processingTasks) {
      try {
        const task: RedisTask = JSON.parse(taskData);
        const taskAge = now - task.timestamps.createdAt;
        
        // 如果任务超时
        if (taskAge > task.metadata.timeout) {
          // 移除任务并标记为超时
          await this.redis.lrem(REDIS_KEYS.TASK_PROCESSING, 1, taskData);
          
          task.status = TaskStatus.TIMEOUT;
          task.timestamps.updatedAt = now;
          task.timestamps.completedAt = now;
          
          await this.redis.set(REDIS_KEYS.TASK_DATA(task.id), JSON.stringify(task));
          await this.redis.lpush(REDIS_KEYS.TASK_FAILED, JSON.stringify(task));
          
          // 更新统计
          await this.redis.hincrby(REDIS_KEYS.STATS_TASKS, 'processing', -1);
          await this.redis.hincrby(REDIS_KEYS.STATS_TASKS, 'failed', 1);
          
          cleanedCount++;
        }
      } catch (error) {
        console.error('清理过期任务时出错:', error);
      }
    }

    if (cleanedCount > 0) {
      console.log(`清理了 ${cleanedCount} 个过期任务`);
    }

    return cleanedCount;
  }
}