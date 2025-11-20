import { z } from 'zod';

export const createContactMessageSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    subject: z.string().max(150).optional(),
    message: z.string().min(10).max(2000),
    source: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const contactMessageIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const updateContactStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(['new', 'in-progress', 'resolved'])
  })
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>['body'];

export const exportContactsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['new', 'in-progress', 'resolved']).optional()
  })
});
