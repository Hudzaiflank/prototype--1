import { pool } from "../config/database.js";
import { env } from "../config/env.js";

export async function cleanupExpiredGameData() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [sessions] = await connection.execute(
      "SELECT id FROM game_sessions WHERE expires_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [env.retentionDays],
    );
    const ids = sessions.map((session) => session.id);
    if (!ids.length) {
      await connection.commit();
      return 0;
    }
    const placeholders = ids.map(() => "?").join(",");
    for (const table of [
      "game_turns",
      "assignments",
      "group_members",
      "`groups`",
      "problems",
      "participants",
      "game_sessions",
    ]) {
      await connection.execute(
        `DELETE FROM ${table} WHERE game_session_id IN (${placeholders})`,
        ids,
      );
    }
    await connection.commit();
    return ids.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
