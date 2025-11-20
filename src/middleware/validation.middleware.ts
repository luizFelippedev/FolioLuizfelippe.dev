import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject, ZodError } from 'zod';

import { createValidationError } from '@utils/helpers/error.helper';

export const validate = (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      if (result.body) {
        req.body = result.body;
      }
      if (result.query) {
        req.query = result.query;
      }
      if (result.params) {
        req.params = result.params;
      }
      next();
    } catch (error) {
      const zodError = error as ZodError;
      next(createValidationError('Validation failed', zodError.flatten()));
    }
  };

export default validate;
