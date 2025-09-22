import 'dotenv/config';
import { config } from './config/config';
import { databaseService } from './services/database';
import { RedisTaskService } from './services/redisTaskService';
import { AgentManager } from './models/AgentManager';
import { initializeAgentManager as initializeAgentRoutes } from './routes/agents';
import { initializeAgentManager as initializeTaskRoutes } from './routes/tasks';
import { AgentRegistration, AgentStatus, TaskStatus } from './types/redis';
import app from './app';

// 初始化服务
const initializeServices = async () => {
  try {
    // 连接数据库
    await databaseService.connect();
    console.log('✅ Database connected successfully');

    // 创建Redis任务服务
    const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';
    const redisTaskService = new RedisTaskService(redisUrl);
    await redisTaskService.connect();
    console.log('✅ Redis connected successfully');

    // 创建Agent管理器
    const agentManager = new AgentManager();
    
    // 初始化路由管理器
    initializeAgentRoutes(agentManager);
    initializeTaskRoutes(agentManager);

    // 注册Agent Runtime到Redis
    const runtimeId = process.env.RUNTIME_ID || `runtime-${Date.now()}`;
    const agentId = process.env.AGENT_ID || 'default-agent';
    
    const registration: AgentRegistration = {
      id: agentId,
      runtimeId,
      name: process.env.AGENT_NAME || 'Default Agent',
      description: 'Agent Runtime Instance',
      capabilities: ['text-generation', 'tool-calling'],
      status: AgentStatus.ONLINE,
      metadata: {
        version: '1.0.0',
        host: 'localhost',
        port: config.port,
        pid: process.pid,
        startedAt: Date.now()
      },
      performance: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0
      },
      heartbeat: {
        lastHeartbeatAt: Date.now(),
        interval: 30000
      }
    };

    await redisTaskService.registerAgent(registration);
    console.log(`✅ Agent ${agentId} registered successfully`);

    // 启动心跳机制
    redisTaskService.startHeartbeat(agentId);
    console.log('✅ Heartbeat started');

    // 启动任务监听
    redisTaskService.listenForTasks(agentId, async (task) => {
      try {
        console.log(`收到任务: ${task.id}`);
        
        // 这里应该调用实际的Agent执行逻辑
        // 暂时模拟任务执行
        const startTime = Date.now();
        
        // 模拟任务处理
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const executionTime = Date.now() - startTime;
        
        // 更新任务状态为完成
        await redisTaskService.updateTaskStatus(task.id, TaskStatus.COMPLETED, {
          taskId: task.id,
          agentId: task.agentId,
          status: TaskStatus.COMPLETED,
          output: { message: 'Task completed successfully' },
          executionTime,
          completedAt: Date.now()
        });
        
        console.log(`任务 ${task.id} 执行完成`);
      } catch (error) {
        console.error(`任务 ${task.id} 执行失败:`, error);
        
        // 更新任务状态为失败
        await redisTaskService.updateTaskStatus(task.id, TaskStatus.FAILED, {
          taskId: task.id,
          agentId: task.agentId,
          status: TaskStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0,
          completedAt: Date.now()
        });
      }
    });

    console.log('✅ Services initialized successfully');
    return { agentManager, redisTaskService };
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
};

// 启动应用
const startApp = async () => {
  try {
    console.log('🚀 Starting Agent Runtime...');
    
    // 初始化服务
    const { agentManager, redisTaskService } = await initializeServices();
    
    const PORT = config.port;
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Agent Runtime server is running on port ${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        try {
          await redisTaskService.disconnect();
          await databaseService.disconnect();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

startApp();