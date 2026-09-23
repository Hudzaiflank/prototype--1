import { z } from "zod";

export const createTeacherSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(150),
    nip: z.string().regex(/^\d{18}$/, "NIP harus terdiri dari 18 digit angka"),
    email: z.string().email().optional(),
  }),
});
export const teacherListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
});
export const assignTeacherSchema = z.object({
  body: z.object({ teacherId: z.coerce.number().int().positive() }),
});
