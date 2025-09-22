import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from '../types/common';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = (error as any).errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new AppError(`Validation failed: ${errorMessage}`, 400);
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = (error as any).errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new AppError(`Query validation failed: ${errorMessage}`, 400);
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = (error as any).errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new AppError(`Params validation failed: ${errorMessage}`, 400);
      }
      next(error);
    }
  };
};