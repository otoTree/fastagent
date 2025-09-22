import { Router } from 'express';
import taskRoutes from './tasks';
import agentRoutes from './agents';
import toolRoutes from './tools';

const router = Router();

// 挂载路由
router.use('/tasks', taskRoutes);
router.use('/agents', agentRoutes);
router.use('/tools', toolRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'agent-runtime'
    }
  });
});

// API信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Agent Runtime API',
      version: '1.0.0',
      description: 'Agent execution runtime with task management and tool integration',
      endpoints: {
        tasks: '/api/tasks',
        agents: '/api/agents',
        tools: '/api/tools',
        health: '/api/health'
      }
    }
  });
});

export default router;