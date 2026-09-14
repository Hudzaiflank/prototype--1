import { pool } from "../config/database.js";
import { cleanupExpiredGameData } from "../services/retention.service.js";

try {
  const removed = await cleanupExpiredGameData();
  console.log(
    `Retention cleanup completed. Removed ${removed} expired game sessions.`,
  );
} finally {
  await pool.end();
}
