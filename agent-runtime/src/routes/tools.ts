import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { toolService, ToolCallRequestSchema } from '../services/toolService';
import { validateBody, validateQuery } from '../middleware/validation';

const router = Router();

// 获取所有可用工具
router.get('/', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const tools = await toolService.getAvailableTools(forceRefresh);
    
    res.json({
      success: true,
      data: tools,
      meta: {
        count: tools.length,
        cached: !forceRefresh
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取工具类型列表
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = await toolService.getToolTypes();
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 按类型获取工具
router.get('/by-type/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const tools = await toolService.getToolsByType(type);
    
    res.json({
      success: true,
      data: tools,
      meta: {
        type,
        count: tools.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 搜索工具
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, category, limit = 10 } = req.query;
    
    const tools = await toolService.getAvailableTools();
    
    let filteredTools = tools;
    
    if (query) {
      const searchQuery = query as string;
      filteredTools = tools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (category) {
      filteredTools = filteredTools.filter(tool => 
        tool.category === category
      );
    }
    
    const limitNum = parseInt(limit as string);
    if (limitNum > 0) {
      filteredTools = filteredTools.slice(0, limitNum);
    }
    
    return res.json({
      success: true,
      data: {
        tools: filteredTools,
        total: filteredTools.length,
        query: query || null,
        category: category || null
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取工具详情
router.get('/:toolId', async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params;
    
    const tools = await toolService.getAvailableTools();
    const tool = tools.find(t => t.id === toolId);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }
    
    return res.json({
      success: true,
      data: tool
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 批量执行工具
router.post('/batch/execute', async (req: Request, res: Response) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests)) {
      return res.status(400).json({
        success: false,
        error: 'Requests must be an array'
      });
    }
    
    const results = [];
    
    for (const request of requests) {
      try {
        const result = await toolService.callTool(request);
        results.push({
          toolId: request.toolId,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          toolId: request.toolId,
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return res.json({
      success: true,
      data: {
        results,
        total: requests.length,
        successful: results.filter(r => r.success).length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取工具统计信息
router.get('/:toolId/stats', async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params;
    
    // 这里需要实现工具统计逻辑
    // 暂时返回模拟数据
    return res.json({
      success: true,
      data: {
        toolId,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageExecutionTime: 0,
        lastUsed: null
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 调用工具
router.post('/:toolId/execute', validateBody(ToolCallRequestSchema), async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params;
    const callRequest = {
      ...req.body,
      toolId,
      toolName: req.body.toolName || toolId
    };

    const result = await toolService.callTool(callRequest);
    
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        data: result
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 批量调用工具
router.post('/batch/execute', async (req: Request, res: Response) => {
  try {
    const batchSchema = z.object({
      requests: z.array(ToolCallRequestSchema).min(1).max(10) // 限制最多10个并发调用
    });

    const { requests } = batchSchema.parse(req.body);
    const results = await toolService.callToolsBatch(requests);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return res.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch request',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 验证工具输入
router.post('/:toolId/validate', async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params;
    const { input } = req.body;

    const validation = await toolService.validateToolInput(toolId, input);
    
    return res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 获取工具统计信息
router.get('/:toolId/stats', async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params;
    const stats = await toolService.getToolStats(toolId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Tool stats not found'
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

// 获取所有工具统计信息
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await toolService.getToolStats();
    
    res.json({
      success: true,
      data: stats || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 清除工具缓存
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    toolService.clearCache();
    
    res.json({
      success: true,
      data: {
        message: 'Tool cache cleared successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 工具服务健康检查
router.get('/health/check', async (req: Request, res: Response) => {
  try {
    const health = await toolService.healthCheck();
    
    if (health.healthy) {
      res.json({
        success: true,
        data: health
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'Tool service unhealthy',
        data: health
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;