import express from 'express';
import cors from 'cors';
import { config } from './config/config';
import { databaseService } from './services/database';
import { backendSyncService } from './models/BackendSync';
import { AgentManager } from './models/AgentManager';
import routes from './routes';
import { initializeAgentManager as initializeAgentRoutes } from './routes/agents';
import { initializeAgentManager as initializeTaskRoutes } from './routes/tasks';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 初始化服务
const initializeServices = async () => {
  try {
    // 连接数据库
    await databaseService.connect();
    console.log('✅ Database connected successfully');

    // 创建Agent管理器
    const agentManager = new AgentManager();
    
    // 初始化路由管理器
    initializeAgentRoutes(agentManager);
    initializeTaskRoutes(agentManager);

    // 启动backend同步监听
    await backendSyncService.startSyncMonitoring((event) => {
      console.log('Backend sync event:', event.type);
      
      if (event.type === 'agents_updated') {
        // 同步更新Agent配置
        event.data.forEach(async (agentConfig: any) => {
          try {
            await agentManager.registerAgent(agentConfig);
          } catch (error) {
            console.error(`Failed to sync agent ${agentConfig.id}:`, error);
          }
        });
      }
    });

    console.log('✅ Services initialized successfully');
    return agentManager;
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
};

// 挂载路由
app.use('/api', routes);

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth,
          runtime: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: (error as Error).message
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// 启动服务器
const startServer = async () => {
  try {
    await initializeServices();
    
    const server = app.listen(config.port, () => {
      console.log(`🚀 Agent Runtime Server running on port ${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
      console.log(`🔗 API base: http://localhost:${config.port}/api`);
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        try {
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
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  startServer();
}

export default app;