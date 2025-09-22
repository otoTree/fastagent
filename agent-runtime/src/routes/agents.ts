import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AgentManager } from '../models/AgentManager';
import { validateBody } from '../middleware/validation';

const router = Router();

// 全局Agent管理器实例
let agentManager: AgentManager;

// 初始化Agent管理器
export const initializeAgentManager = (manager: AgentManager) => {
  agentManager = manager;
};

// 任务执行请求的验证schema
const TaskExecutionSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  input: z.string(),
  context: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  timeout: z.number().default(300000) // 5分钟默认超时
});

// 执行任务接口 - backend调用此接口发送任务给runtime
router.post('/execute-task', validateBody(TaskExecutionSchema), async (req: Request, res: Response) => {
  try {
    const { taskId, agentId, input, context, priority, timeout } = req.body;

    if (!agentManager) {
      return res.status(500).json({ error: 'Agent manager not initialized' });
    }

    // 开始执行任务
    const result = await agentManager.executeTask({
      taskId,
      agentId,
      input,
      context,
      priority,
      timeout
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取任务状态
router.get('/task/:taskId/status', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    if (!agentManager) {
      return res.status(500).json({ error: 'Agent manager not initialized' });
    }

    const status = await agentManager.getTaskStatus(taskId);
    
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 取消任务
router.post('/task/:taskId/cancel', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    if (!agentManager) {
      return res.status(500).json({ error: 'Agent manager not initialized' });
    }

    await agentManager.cancelTask(taskId);
    
    return res.status(200).json({
      success: true,
      message: 'Task cancelled successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取运行时状态
router.get('/status', async (req: Request, res: Response) => {
  try {
    if (!agentManager) {
      return res.status(500).json({ error: 'Agent manager not initialized' });
    }

    const status = await agentManager.getRuntimeStatus();
    
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 健康检查
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'agent-runtime',
      agentManagerInitialized: !!agentManager
    };
    
    return res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;