import { z } from "zod";

export const historyListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    classId: z.coerce.number().int().positive().optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
});

export const turnActionSchema = z.object({
  body: z.object({ turnId: z.coerce.number().int().positive() }),
});

export const teacherProblemSchema = z.object({
  body: z.object({
    participantId: z.coerce.number().int().positive(),
    content: z.string().trim().min(1).max(5000),
  }),
});

export const teacherParticipantSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1).max(150),
    content: z.string().trim().max(5000).optional(),
  }),
});
