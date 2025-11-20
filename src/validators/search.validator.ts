import { z } from 'zod';

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(2),
    limit: z.coerce.number().int().positive().max(50).default(10)
  })
});

export type SearchQuery = z.infer<typeof searchQuerySchema>['query'];
