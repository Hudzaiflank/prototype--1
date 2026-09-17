import { z } from "zod";

export const createClassSchema = z.object({
  body: z.object({
    gradeLevel: z.string().trim().min(1).max(10),
    major: z.string().trim().max(50).default(""),
    classNumber: z.coerce.number().int().positive(),
    academicYear: z.string().regex(/^\d{4}\/\d{4}$/).default("2026/2027"),
  }),
});

export const updateClassSchema = z.object({
  body: z.object({
    gradeLevel: z.string().trim().min(1).max(10),
    major: z.string().trim().max(50).default(""),
    classNumber: z.coerce.number().int().positive(),
    academicYear: z.string().regex(/^\d{4}\/\d{4}$/).default("2026/2027"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
});

export const schoolYearActionSchema = z.object({
  body: z.object({
    academicYear: z.string().regex(/^\d{4}\/\d{4}$/),
    nextAcademicYear: z.string().regex(/^\d{4}\/\d{4}$/).optional(),
    gradeLevel: z.string().trim().min(1).max(10).optional(),
  }),
});
