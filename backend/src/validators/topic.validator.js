import { z } from "zod";
export const createTopicSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(150),
    description: z.string().max(5000).optional(),
    visibility: z.enum(["PRIVATE", "SCHOOL"]),
  }),
});
