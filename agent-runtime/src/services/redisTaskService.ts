import Redis from 'ioredis';
import { RedisTask, AgentRegistration, AgentHeartbeat, TaskResult, TaskStatus, AgentStatus, REDIS_KEYS } from '../types/redis';
import { AgentConfig, AgentInstance } from '../types/agent';

export class RedisTaskService {
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(redisUrl: string) {
    // 创建Redis连接
    this.redis = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);
  }

  // 连接到Redis
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.redis.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);
      console.log('Redis连接成功');
    } catch (error) {
      console.error('Redis连接失败:', error);
      throw error;
    }
  }

  // 断开Redis连接
  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    await Promise.all([
      this.redis.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect()
    ]);
  }

  // 注册Agent Runtime
  async registerAgent(registration: AgentRegistration): Promise<void> {
    const key = REDIS_KEYS.AGENT_REGISTRY;
    await this.redis.hset(key, registration.id, JSON.stringify(registration));
    
    // 设置Agent状态
    await this.redis.set(
      REDIS_KEYS.AGENT_STATUS(registration.id),
      registration.status,
      'EX',
      300 // 5分钟过期
    );
    
    console.log(`Agent ${registration.id} 注册成功`);
  }

  // 发送心跳
  async sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    const heartbeatKey = REDIS_KEYS.AGENT_HEARTBEAT(heartbeat.agentId);
    const statusKey = REDIS_KEYS.AGENT_STATUS(heartbeat.agentId);
    
    // 更新心跳数据
    await this.redis.setex(heartbeatKey, 300, JSON.stringify(heartbeat)); // 5分钟过期
    
    // 更新Agent状态
    await this.redis.setex(statusKey, 300, heartbeat.status); // 5分钟过期
    
    // 更新注册表中的心跳时间
    const registryKey = REDIS_KEYS.AGENT_REGISTRY;
    const agentData = await this.redis.hget(registryKey, heartbeat.agentId);
    if (agentData) {
      const registration: AgentRegistration = JSON.parse(agentData);
      registration.heartbeat.lastHeartbeatAt = heartbeat.timestamp;
      registration.status = heartbeat.status;
      await this.redis.hset(registryKey, heartbeat.agentId, JSON.stringify(registration));
    }
  }

  // 启动心跳机制
  startHeartbeat(agentId: string, interval: number = 30000): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        const heartbeat: AgentHeartbeat = {
          runtimeId: process.env.RUNTIME_ID || 'default-runtime',
          agentId,
          timestamp: Date.now(),
          status: AgentStatus.ONLINE,
          metrics: {
            cpuUsage: process.cpuUsage().user / 1000000, // 转换为秒
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // 转换为MB
            activeTasks: 0, // 这里需要实际的活跃任务数
            queueSize: await this.getQueueSize()
          }
        };
        
        await this.sendHeartbeat(heartbeat);
      } catch (error) {
        console.error('发送心跳失败:', error);
      }
    }, interval);
  }

  // 监听任务队列
  async listenForTasks(agentId: string, callback: (task: RedisTask) => Promise<void>): Promise<void> {
    console.log(`开始监听任务队列，Agent ID: ${agentId}`);
    
    while (true) {
      try {
        // 使用BLPOP阻塞式获取任务
        const result = await this.redis.blpop(REDIS_KEYS.TASK_QUEUE, 10); // 10秒超时
        
        if (result) {
          const [, taskData] = result;
          const task: RedisTask = JSON.parse(taskData);
          
          // 检查任务是否分配给当前Agent
          if (task.agentId === agentId) {
            // 将任务移到处理中队列
            await this.redis.lpush(REDIS_KEYS.TASK_PROCESSING, JSON.stringify(task));
            
            // 更新任务状态
            task.status = TaskStatus.PROCESSING;
            task.timestamps.startedAt = Date.now();
            task.timestamps.updatedAt = Date.now();
            
            await this.redis.set(REDIS_KEYS.TASK_DATA(task.id), JSON.stringify(task));
            
            // 执行任务回调
            await callback(task);
          } else {
            // 如果任务不是分配给当前Agent，重新放回队列
            await this.redis.rpush(REDIS_KEYS.TASK_QUEUE, taskData);
          }
        }
      } catch (error) {
        console.error('监听任务队列出错:', error);
        // 短暂延迟后继续监听
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // 更新任务状态
  async updateTaskStatus(taskId: string, status: TaskStatus, result?: TaskResult): Promise<void> {
    const taskKey = REDIS_KEYS.TASK_DATA(taskId);
    const taskData = await this.redis.get(taskKey);
    
    if (!taskData) {
      throw new Error(`任务 ${taskId} 不存在`);
    }
    
    const task: RedisTask = JSON.parse(taskData);
    task.status = status;
    task.timestamps.updatedAt = Date.now();
    
    if (result) {
      task.result = {
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        tokens: result.tokens
      };
      task.timestamps.completedAt = result.completedAt;
    }
    
    // 更新任务数据
    await this.redis.set(taskKey, JSON.stringify(task));
    
    // 从处理中队列移除
    await this.redis.lrem(REDIS_KEYS.TASK_PROCESSING, 1, JSON.stringify(task));
    
    // 根据状态添加到相应队列
    if (status === TaskStatus.COMPLETED) {
      await this.redis.lpush(REDIS_KEYS.TASK_COMPLETED, JSON.stringify(task));
    } else if (status === TaskStatus.FAILED) {
      await this.redis.lpush(REDIS_KEYS.TASK_FAILED, JSON.stringify(task));
    }
    
    console.log(`任务 ${taskId} 状态更新为: ${status}`);
  }

  // 获取队列大小
  async getQueueSize(): Promise<number> {
    return await this.redis.llen(REDIS_KEYS.TASK_QUEUE);
  }

  // 获取Agent信息
  async getAgentInfo(agentId: string): Promise<AgentRegistration | null> {
    const agentData = await this.redis.hget(REDIS_KEYS.AGENT_REGISTRY, agentId);
    return agentData ? JSON.parse(agentData) : null;
  }

  // 获取所有在线Agent
  async getOnlineAgents(): Promise<AgentRegistration[]> {
    const allAgents = await this.redis.hgetall(REDIS_KEYS.AGENT_REGISTRY);
    const agents: AgentRegistration[] = [];
    
    for (const [agentId, agentData] of Object.entries(allAgents)) {
      const agent: AgentRegistration = JSON.parse(agentData);
      
      // 检查心跳是否在有效期内（5分钟）
      const now = Date.now();
      const heartbeatAge = now - agent.heartbeat.lastHeartbeatAt;
      
      if (heartbeatAge < 300000) { // 5分钟
        agents.push(agent);
      }
    }
    
    return agents;
  }
}