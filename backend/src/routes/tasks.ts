import express from 'express';
import { authenticate } from '@/middleware/auth';
import RedisTaskServiceSingleton from '@/services/redisTaskServiceSingleton';
import { Agent } from '@/models/Agent';
import { Project } from '@/models/Project';
import { TriggerType, TaskPriority } from '@/types/redis';
import { CreateTaskRequestSchema } from '@/types/task';
import { ApiResponse } from '@/types';
import { z } from 'zod';

const router = express.Router();

// 创建任务
router.post('/create', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = CreateTaskRequestSchema.parse(req.body);
    
    // 检查Agent是否存在且属于用户
    const agent = await Agent.findOne({ 
      _id: validatedData.agentId, 
      owner: req.user!._id 
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found' }
      } as ApiResponse<null>);
    }

    // 获取Redis任务服务实例
    const redisTaskService = await RedisTaskServiceSingleton.getInstance();
    
    // 检查Agent是否在线
    const isOnline = await redisTaskService.isAgentOnline(validatedData.agentId);
    if (!isOnline) {
      return res.status(503).json({
        success: false,
        error: { message: 'Agent is currently offline' }
      } as ApiResponse<null>);
    }

    // 如果指定了项目ID，检查项目是否存在且属于用户
    if (validatedData.projectId) {
      const project = await Project.findOne({ 
        _id: validatedData.projectId, 
        owner: req.user!._id 
      });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found' }
        } as ApiResponse<null>);
      }
    }

    // 创建任务
    const taskId = await redisTaskService.createTask({
      agentId: validatedData.agentId,
      triggerType: 'api' as TriggerType,
      priority: validatedData.priority || TaskPriority.NORMAL,
      input: {
        prompt: validatedData.input.prompt,
        data: validatedData.input.data,
        context: validatedData.input.context
      },
      metadata: {
        userId: req.user!._id.toString(),
        projectId: validatedData.projectId,
        source: 'api',
        timeout: validatedData.timeout || 30000,
        maxRetries: validatedData.maxRetries || 3
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        message: 'Task created successfully'
      }
    } as ApiResponse<{
      taskId: string;
      status: string;
      message: string;
    }>);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.errors
        }
      } as ApiResponse<null>);
    }

    console.error('创建任务失败:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    } as ApiResponse<null>);
  }
});

// 批量创建任务
router.post('/batch-create', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tasks array is required and cannot be empty' }
      } as ApiResponse<null>);
    }

    if (tasks.length > 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot create more than 100 tasks at once' }
      } as ApiResponse<null>);
    }

    // 验证所有任务数据
    const validatedTasks = tasks.map(task => CreateTaskRequestSchema.parse(task));
    
    // 检查所有Agent是否存在且属于用户
    const agentIds = [...new Set(validatedTasks.map(task => task.agentId))];
    const agents = await Agent.find({ 
      _id: { $in: agentIds }, 
      owner: req.user!._id 
    });
    
    if (agents.length !== agentIds.length) {
      return res.status(404).json({
        success: false,
        error: { message: 'One or more agents not found' }
      } as ApiResponse<null>);
    }

    // 获取Redis任务服务实例
    const redisTaskService = await RedisTaskServiceSingleton.getInstance();
    
    // 检查Agent是否在线
    const onlineAgents = await redisTaskService.getOnlineAgents();
    const offlineAgents = agentIds.filter(id => !onlineAgents.includes(id));
    
    if (offlineAgents.length > 0) {
      return res.status(503).json({
        success: false,
        error: { 
          message: 'Some agents are offline',
          details: { offlineAgents }
        }
      } as ApiResponse<null>);
    }

    // 创建任务数据
    const tasksData = validatedTasks.map(task => ({
      agentId: task.agentId,
      triggerType: TriggerType.API,
      priority: task.priority || TaskPriority.NORMAL,
      input: {
        prompt: task.input.prompt,
        data: task.input.data,
        context: task.input.context
      },
      metadata: {
        userId: req.user!._id.toString(),
        projectId: task.projectId,
        source: 'api-batch',
        timeout: task.timeout,
        maxRetries: task.maxRetries
      }
    }));

    // 批量创建任务
    const taskIds = await redisTaskService.createTasks(tasksData);

    return res.status(201).json({
      success: true,
      data: {
        taskIds,
        count: taskIds.length,
        message: 'Tasks created successfully'
      }
    } as ApiResponse<{
      taskIds: string[];
      count: number;
      message: string;
    }>);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.errors
        }
      } as ApiResponse<null>);
    }

    console.error('批量创建任务失败:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    } as ApiResponse<null>);
  }
});

// 查询任务状态
router.get('/:taskId/status', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Task ID is required' }
      } as ApiResponse<null>);
    }

    // 获取Redis任务服务实例
    const redisTaskService = await RedisTaskServiceSingleton.getInstance();
    
    // 获取任务状态
    const task = await redisTaskService.getTaskStatus(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found' }
      } as ApiResponse<null>);
    }

    // 检查任务是否属于当前用户
    if (task.metadata.userId !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      } as ApiResponse<null>);
    }

    return res.json({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        agentId: task.agentId,
        triggerType: task.triggerType,
        priority: task.priority,
        input: task.input,
        result: task.result,
        timestamps: task.timestamps,
        metadata: {
          source: task.metadata.source,
          retryCount: task.metadata.retryCount,
          maxRetries: task.metadata.maxRetries
        }
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('查询任务状态失败:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    } as ApiResponse<null>);
  }
});

// 获取任务统计
router.get('/stats', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const redisTaskService = await RedisTaskServiceSingleton.getInstance();
    const stats = await redisTaskService.getTaskStats();
    const queueSize = await redisTaskService.getQueueSize();
    const onlineAgents = await redisTaskService.getOnlineAgents();

    res.json({
      success: true,
      data: {
        tasks: stats,
        queueSize,
        onlineAgents: onlineAgents.length,
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('获取任务统计失败:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    } as ApiResponse<null>);
  }
});

// 清理过期任务（管理员接口）
router.post('/cleanup', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const redisTaskService = await RedisTaskServiceSingleton.getInstance();
    const cleanedCount = await redisTaskService.cleanupExpiredTasks();

    res.json({
      success: true,
      data: {
        cleanedCount,
        message: `Cleaned up ${cleanedCount} expired tasks`
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('清理过期任务失败:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    } as ApiResponse<null>);
  }
});

export default router;