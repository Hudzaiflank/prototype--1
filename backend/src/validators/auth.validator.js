import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(255),
  }),
});

export const passwordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(255),
    newPassword: z.string().min(8).max(255),
  }),
});
