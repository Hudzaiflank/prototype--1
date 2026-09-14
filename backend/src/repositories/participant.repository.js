import { pool } from "../config/database.js";

export async function findBySessionUuid(gameSessionId, sessionUuid) {
  const [rows] = await pool.execute(
    `SELECT id, game_session_id AS gameSessionId, session_uuid AS sessionId, full_name AS fullName, status
	 FROM participants WHERE game_session_id = ? AND session_uuid = ? LIMIT 1`,
    [gameSessionId, sessionUuid],
  );
  return rows[0] ?? null;
}

export async function updateStatus(id, status) {
  await pool.execute(
    "UPDATE participants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, id],
  );
}
