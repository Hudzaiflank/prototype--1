import { z } from "zod";

export const createSchoolSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    level: z.enum(["SMP", "SMA", "SMK"]),
  }),
});

export const listSchoolSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
});

export const schoolStatusSchema = z.object({
  body: z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) }),
});
