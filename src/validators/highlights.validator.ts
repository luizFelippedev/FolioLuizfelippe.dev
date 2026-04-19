import { paginationQuerySchema } from '@validators/common/pagination.validator';
import { z } from 'zod';

export const listHomeHighlightsQuerySchema = z.object({
  query: paginationQuerySchema
});

