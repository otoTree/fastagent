import { Request, Response, NextFunction } from 'express';
import { AppError, ApiResponse } from '../types/common';
import { config } from '../config/config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // 处理自定义错误
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // 处理 Zod 验证错误
  if (error.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // 开发环境下显示详细错误信息
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  };

  console.error('❌ Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json(response);
};