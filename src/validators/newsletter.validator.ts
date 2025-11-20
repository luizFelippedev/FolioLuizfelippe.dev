import { z } from 'zod';

export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().max(120).optional(),
    tags: z.array(z.string()).optional()
  })
});

export const confirmSubscriptionSchema = z.object({
  params: z.object({
    token: z.string().min(16)
  })
});

export const unsubscribeSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

export const newsletterAdminQuerySchema = z.object({
  query: z.object({
    confirmed: z
      .string()
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    tag: z.string().optional()
  })
});

export type SubscribeInput = z.infer<typeof subscribeSchema>['body'];

export const triggerNewsletterSchema = z.object({
  body: z
    .object({
      subject: z.string().max(150).optional(),
      content: z.string().max(5000).optional()
    })
    .optional()
});
