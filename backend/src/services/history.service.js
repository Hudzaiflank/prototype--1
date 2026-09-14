import { AppError } from "../utils/errors.js";
import * as repository from "../repositories/history.repository.js";

export async function getSessionHistory(sessionId, teacherId) {
  const rows = await repository.getSessionHistory(sessionId, teacherId);
  if (!rows.length)
    throw new AppError("Game history not found", "HISTORY_NOT_FOUND", 404);
  return rows;
}

export async function listHistory(query, teacherId) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
  const result = await repository.listTeacherHistory({
    teacherId,
    offset: (page - 1) * limit,
    limit,
    classId: query.classId,
    from: query.from,
    to: query.to,
  });
  return {
    ...result,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}
