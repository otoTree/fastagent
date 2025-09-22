import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AgentManager } from '../models/AgentManager';
import { CreateTaskRequestSchema, TaskType, TaskPriority } from '../types/task';
import { validateBody } from '../middleware/validation';

const router = Router();

// 全局Agent管理器实例
let agentManager: AgentManager;

// 初始化Agent管理器
export const initializeAgentManager = (manager: AgentManager) => {
  agentManager = manager;
};

// 创建任务
router.post('/create', validateBody(CreateTaskRequestSchema), async (req: Request, res: Response) => {
  try {
    const taskRequest = req.body;
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    if (!agentManager) {
      return res.status(500).json({ error: 'Agent manager not initialized' });
    }

    const task = await agentManager.createTask(taskRequest, userId);
    
    return res.status(201).json({
      success: true,
      data: {
        taskId: task.id,
        status: task.result?.status || 'pending',
        createdAt: task.createdAt
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Webhook任务接收
router.post('/webhook/:triggerId', async (req: Request, res: Response) => {
  try {
    const { triggerId } = req.params;
    const payload = req.body;
    const userId = req.headers['x-user-id'] as string || 'webhook';

    if (!agentManager) {
      return res.status(500).json({ error: 'Agent manager not initialized' });
    }

    // 这里需要根据triggerId找到对应的Agent
    // 简化实现：假设triggerId就是agentId
    const agentId = triggerId;

    const taskRequest = {
      type: TaskType.WEBHOOK,
      priority: TaskPriority.MEDIUM,
      agentId,
      projectId: req.headers['x-project-id'] as string || 'default',
      triggerId,
      payload
    };

    const task = await agentManager.createTask(taskRequest, userId);
    
    return res.status(201).json({
      success: true,
      data: {
        taskId: task.id,
        triggerId,
        status: 'accepted'
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// API任务接收
router.post('/api/:agentId/execute', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { input, context, stream = false } = req.body;
    const userId = req.headers['x-user-id'] as string || 'api';
    const projectId = req.headers['x-project-id'] as string;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const taskRequest = {
      type: TaskType.API,
      priority: TaskPriority.MEDIUM,
      agentId,
      projectId,
      payload: { input, context, stream }
    };

    const task = await agentManager.createTask(taskRequest, userId);
    
    if (stream) {
      // 流式响应处理
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // 监听任务完成事件
      const onTaskCompleted = (completedTask: any) => {
        if (completedTask.id === task.id) {
          res.write(`data: ${JSON.stringify({
            type: 'completed',
            data: completedTask.result
          })}\n\n`);
          res.end();
          agentManager.off('agentTaskCompleted', onTaskCompleted);
        }
      };

      agentManager.on('agentTaskCompleted', onTaskCompleted);
      
      // 发送初始响应
      res.write(`data: ${JSON.stringify({
        type: 'started',
        taskId: task.id
      })}\n\n`);

      // 流式响应不需要return，但为了满足TypeScript要求
      return;

    } else {
      // 同步响应
      return res.status(202).json({
        success: true,
        data: {
          taskId: task.id,
          status: 'accepted'
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取任务状态
router.get('/:taskId/status', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    // 这里需要实现任务状态查询逻辑
    // 暂时返回模拟数据
    res.json({
      success: true,
      data: {
        taskId,
        status: 'running',
        progress: 50
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取Agent统计信息
router.get('/agents/:agentId/stats', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    
    if (!agentManager) {
      return res.status(503).json({
        success: false,
        error: 'Agent manager not initialized'
      });
    }

    const stats = agentManager.getAgentStats(agentId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取所有Agent状态
router.get('/agents/status', async (req: Request, res: Response) => {
  try {
    if (!agentManager) {
      return res.status(503).json({
        success: false,
        error: 'Agent manager not initialized'
      });
    }

    const agents = agentManager.getAllAgents();
    
    return res.json({
      success: true,
      data: agents.map(agent => ({
        id: agent.config.id,
        name: agent.config.name,
        status: agent.state.status,
        currentTasks: agent.state.currentTasks.length,
        metrics: agent.state.metrics
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 定时任务调度
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const scheduleSchema = z.object({
      agentId: z.string(),
      projectId: z.string(),
      cronExpression: z.string(),
      payload: z.record(z.any()),
      timezone: z.string().default('UTC')
    });

    const scheduleData = scheduleSchema.parse(req.body);
    const userId = req.headers['x-user-id'] as string || 'scheduler';

    // 这里需要实现cron调度逻辑
    // 暂时返回成功响应
    res.json({
      success: true,
      data: {
        scheduleId: `schedule_${Date.now()}`,
        message: 'Task scheduled successfully'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 批量任务处理
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { tasks } = req.body;
    const userId = req.headers['x-user-id'] as string || 'batch';

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tasks array is required and cannot be empty'
      });
    }

    if (!agentManager) {
      return res.status(503).json({
        success: false,
        error: 'Agent manager not initialized'
      });
    }

    const results = [];
    
    for (const taskRequest of tasks) {
      try {
        const task = await agentManager.createTask(taskRequest, userId);
        results.push({
          success: true,
          taskId: task.id,
          agentId: taskRequest.agentId
        });
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          agentId: taskRequest.agentId
        });
      }
    }

    return res.json({
      success: true,
      data: {
        results,
        total: tasks.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;