import { z } from "zod";

export const createClassSchema = z.object({
  body: z.object({
    gradeLevel: z.string().trim().min(1).max(10),
    major: z.string().trim().min(1).max(50),
    classNumber: z.coerce.number().int().positive(),
  }),
});

export const updateClassSchema = z.object({
  body: z.object({
    gradeLevel: z.string().trim().min(1).max(10),
    major: z.string().trim().min(1).max(50),
    classNumber: z.coerce.number().int().positive(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
});
