import express from 'express';
import { authenticate } from '@/middleware/auth';
import { TriggerLog, CreateTriggerLogSchema, TriggerLogStatus } from '@/models/TriggerLog';
import { Trigger } from '@/models/Trigger';
import { ApiResponse, PaginationQuery } from '@/types';
import { z } from 'zod';

const router = express.Router();

// 获取触发器日志列表
router.get('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      triggerId, 
      projectId, 
      agentId,
      status,
      startDate,
      endDate
    } = req.query as PaginationQuery & { 
      triggerId?: string; 
      projectId?: string; 
      agentId?: string;
      status?: TriggerLogStatus;
      startDate?: string;
      endDate?: string;
    };
    
    const query: any = { owner: req.user!._id };
    
    // 添加过滤条件
    if (triggerId) query.triggerId = triggerId;
    if (projectId) query.projectId = projectId;
    if (agentId) query.agentId = agentId;
    if (status) query.status = status;
    
    // 时间范围过滤
    if (startDate || endDate) {
      query.triggeredAt = {};
      if (startDate) query.triggeredAt.$gte = new Date(startDate);
      if (endDate) query.triggeredAt.$lte = new Date(endDate);
    }

    const logs = await TriggerLog.find(query)
      .populate('triggerId', 'name type')
      .populate('projectId', 'name')
      .populate('agentId', 'name')
      .sort({ triggeredAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // 转换数据格式以匹配前端期望
    const transformedLogs = logs.map(log => ({
      _id: log._id,
      triggerId: log.triggerId,
      projectId: log.projectId,
      agentId: log.agentId,
      userId: log.owner,
      status: log.status,
      requestData: log.requestData,
      responseData: log.responseData,
      errorMessage: log.errorMessage,
      startTime: log.triggeredAt, // 映射 triggeredAt 到 startTime
      endTime: log.triggeredAt ? new Date(log.triggeredAt.getTime() + (log.executionTime || 0)) : undefined,
      duration: log.executionTime,
      trigger: log.triggerId ? {
        _id: (log.triggerId as any)._id,
        name: (log.triggerId as any).name,
        type: (log.triggerId as any).type
      } : null,
      project: log.projectId ? {
        _id: (log.projectId as any)._id,
        name: (log.projectId as any).name
      } : null,
      agent: log.agentId ? {
        _id: (log.agentId as any)._id,
        name: (log.agentId as any).name
      } : null,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    }));

    const total = await TriggerLog.countDocuments(query);

    const response: ApiResponse = {
      success: true,
      data: transformedLogs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// 获取单个触发器日志详情
router.get('/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const log = await TriggerLog.findOne({
      _id: req.params.id,
      owner: req.user!._id
    }).populate(['triggerId', 'projectId', 'agentId']);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger log not found' }
      });
    }

    // 转换数据格式以匹配前端期望
    const transformedLog = {
      _id: log._id,
      triggerId: log.triggerId,
      projectId: log.projectId,
      agentId: log.agentId,
      userId: log.owner,
      status: log.status,
      requestData: log.requestData,
      responseData: log.responseData,
      errorMessage: log.errorMessage,
      startTime: log.triggeredAt,
      endTime: log.triggeredAt ? new Date(log.triggeredAt.getTime() + (log.executionTime || 0)) : undefined,
      duration: log.executionTime,
      trigger: log.triggerId ? {
        _id: (log.triggerId as any)._id,
        name: (log.triggerId as any).name,
        type: (log.triggerId as any).type
      } : null,
      project: log.projectId ? {
        _id: (log.projectId as any)._id,
        name: (log.projectId as any).name
      } : null,
      agent: log.agentId ? {
        _id: (log.agentId as any)._id,
        name: (log.agentId as any).name
      } : null,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    };

    const response: ApiResponse = {
      success: true,
      data: transformedLog
    };

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// 创建触发器日志（内部API，用于记录触发器调用）
router.post('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validatedData = CreateTriggerLogSchema.parse(req.body);
    
    // 验证触发器是否存在且属于当前用户
    const trigger = await Trigger.findOne({ 
      _id: validatedData.triggerId, 
      owner: req.user!._id 
    });
    
    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trigger not found' }
      });
    }

    // 创建日志记录
    const log = new TriggerLog({
      ...validatedData,
      owner: req.user!._id,
      triggeredAt: new Date()
    });
    
    await log.save();
    await log.populate(['triggerId', 'projectId', 'agentId']);
    
    return res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.errors
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// 获取触发器日志统计信息
router.get('/stats/overview', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { 
      triggerId, 
      projectId, 
      agentId,
      days = 7,
      startDate,
      endDate,
      monthOnly = false
    } = req.query as { 
      triggerId?: string; 
      projectId?: string; 
      agentId?: string;
      days?: number;
      startDate?: string;
      endDate?: string;
      monthOnly?: boolean;
    };
    
    const query: any = { owner: req.user!._id };
    
    // 添加过滤条件
    if (triggerId) query.triggerId = triggerId;
    if (projectId) query.projectId = projectId;
    if (agentId) query.agentId = agentId;
    
    // 时间范围处理
    if (monthOnly || (!startDate && !endDate)) {
      // 默认获取当前月份的数据
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      query.triggeredAt = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (startDate && endDate) {
      // 使用指定的日期范围
      query.triggeredAt = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else {
      // 使用天数范围（向后兼容）
      const dateStart = new Date();
      dateStart.setDate(dateStart.getDate() - Number(days));
      query.triggeredAt = { $gte: dateStart };
    }

    // 总调用次数
    const totalCalls = await TriggerLog.countDocuments(query);
    
    // 成功调用次数
    const successCalls = await TriggerLog.countDocuments({
      ...query,
      status: TriggerLogStatus.SUCCESS
    });
    
    // 失败调用次数
    const failedCalls = await TriggerLog.countDocuments({
      ...query,
      status: { $in: [TriggerLogStatus.FAILED, TriggerLogStatus.ERROR, TriggerLogStatus.TIMEOUT] }
    });
    
    // 平均执行时间
    const avgExecutionTime = await TriggerLog.aggregate([
      { $match: query },
      { $group: { _id: null, avgTime: { $avg: '$executionTime' } } }
    ]);
    
    // 按状态分组统计
    const statusStats = await TriggerLog.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // 按日期分组统计（最近7天）
    const dailyStats = await TriggerLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$triggeredAt' }
          },
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', TriggerLogStatus.SUCCESS] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $ne: ['$status', TriggerLogStatus.SUCCESS] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        totalCalls,
        successCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (successCalls / totalCalls * 100).toFixed(2) : '0.00',
        avgExecutionTime: avgExecutionTime[0]?.avgTime || 0,
        statusStats: statusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        dailyStats
      }
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// 删除触发器日志（批量删除）
router.delete('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { ids, olderThan } = req.body as { ids?: string[]; olderThan?: string };
    
    let query: any = { owner: req.user!._id };
    
    if (ids && ids.length > 0) {
      query._id = { $in: ids };
    } else if (olderThan) {
      query.triggeredAt = { $lt: new Date(olderThan) };
    } else {
      return res.status(400).json({
        success: false,
        error: { message: 'Either ids or olderThan parameter is required' }
      });
    }
    
    const result = await TriggerLog.deleteMany(query);
    
    return res.json({
      success: true,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

export default router;