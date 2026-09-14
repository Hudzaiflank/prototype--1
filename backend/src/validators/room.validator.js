import { z } from "zod";
export const gameSessionSchema = z.object({
  body: z.object({
    topicId: z.coerce.number().int().positive().nullable().optional(),
    inputMode: z.enum(["STUDENT", "TEACHER"]),
    gameMode: z.enum(["ALL_STUDENTS", "GROUPS"]),
    problemDisplayLimit: z.coerce.number().int().positive().default(1),
    groupCount: z.coerce.number().int().positive().nullable().default(null),
  }),
});
export const joinRoomSchema = z.object({
  body: z.object({ roomCode: z.string().length(6) }),
});
export const participantSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    fullName: z.string().trim().min(1).max(150),
  }),
});
export const problemSchema = z.object({
  body: z.object({
    participantSessionId: z.string().uuid(),
    content: z.string().trim().min(1).max(5000),
  }),
});
