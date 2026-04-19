import { z } from 'zod';

const portfolioAssistantMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4000)
});

export const portfolioAssistantStreamSchema = z.object({
  body: z.object({
    locale: z.string().trim().min(2).max(10).optional(),
    page: z.string().trim().max(120).optional(),
    messages: z.array(portfolioAssistantMessageSchema).min(1).max(16)
  })
});

export type PortfolioAssistantStreamInput = z.infer<typeof portfolioAssistantStreamSchema>['body'];
