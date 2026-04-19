import { z } from 'zod';

const toneSchema = z.string().trim().min(20).max(1200);

export const updateWiseAssistantSettingsSchema = z.object({
  body: z.object({
    toneBySegment: z.object({
      company: toneSchema,
      recruiter: toneSchema,
      visitor: toneSchema
    })
  })
});

export type UpdateWiseAssistantSettingsInput = z.infer<
  typeof updateWiseAssistantSettingsSchema
>['body'];
