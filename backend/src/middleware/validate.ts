import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validation middleware factory using Zod schemas
 */
export const validate = (schema: ZodSchema, source: RequestPart = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = await schema.parseAsync(data);
      
      // Replace the request data with validated/transformed data
      req[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });

        next(new ValidationError('Validation failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate multiple sources at once
 */
export const validateMultiple = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allErrors: Record<string, string[]> = {};

      for (const [source, schema] of Object.entries(schemas)) {
        if (schema) {
          try {
            const data = req[source as RequestPart];
            const validated = await schema.parseAsync(data);
            req[source as RequestPart] = validated;
          } catch (error) {
            if (error instanceof ZodError) {
              error.errors.forEach((err) => {
                const path = `${source}.${err.path.join('.')}`;
                if (!allErrors[path]) {
                  allErrors[path] = [];
                }
                allErrors[path].push(err.message);
              });
            } else {
              throw error;
            }
          }
        }
      }

      if (Object.keys(allErrors).length > 0) {
        throw new ValidationError('Validation failed', allErrors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
