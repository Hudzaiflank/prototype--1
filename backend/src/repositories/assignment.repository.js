import { pool } from "../config/database.js";

export async function listAssignments(sessionId) {
  const [rows] = await pool.execute(
    `SELECT id, group_id AS groupId, participant_id AS participantId, problem_id AS problemId,
		sequence_number AS sequenceNumber, status, assigned_at AS assignedAt, completed_at AS completedAt
	 FROM assignments WHERE game_session_id = ? ORDER BY sequence_number`,
    [sessionId],
  );
  return rows;
}

export async function findAssignment(id, sessionId) {
  const [rows] = await pool.execute(
    "SELECT * FROM assignments WHERE id = ? AND game_session_id = ? LIMIT 1",
    [id, sessionId],
  );
  return rows[0] ?? null;
}
