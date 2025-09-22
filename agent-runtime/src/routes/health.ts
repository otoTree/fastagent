import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/common';
import { config } from '../config/config';

const router = Router();

// 健康检查端点
router.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Server is healthy',
    data: {
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  };

  res.json(response);
});

export { router as healthRouter };