import { pool } from "../config/database.js";

export async function createTopic({
  schoolId,
  createdBy,
  title,
  description,
  visibility,
}) {
  const [result] = await pool.execute(
    `INSERT INTO topics (school_id, created_by, title, description, visibility)
		 VALUES (?, ?, ?, ?, ?)`,
    [schoolId, createdBy, title, description ?? null, visibility],
  );
  const [rows] = await pool.execute("SELECT * FROM topics WHERE id = ?", [
    result.insertId,
  ]);
  return rows[0];
}

export async function listTopics({ schoolId, userId }) {
  const [rows] = await pool.execute(
    `SELECT id, title, description, visibility, created_by AS createdBy, status, created_at AS createdAt
		 FROM topics WHERE school_id = ? AND status = 'ACTIVE' AND (visibility = 'SCHOOL' OR created_by = ?)
		 ORDER BY created_at DESC`,
    [schoolId, userId],
  );
  return rows;
}

export async function updateTopic({
  topicId,
  userId,
  title,
  description,
  visibility,
}) {
  const [result] = await pool.execute(
    `UPDATE topics SET title = ?, description = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND created_by = ? AND status = 'ACTIVE'`,
    [title, description ?? null, visibility, topicId, userId],
  );
  return result.affectedRows > 0;
}

export async function deleteTopic(topicId, userId) {
  const [result] = await pool.execute(
    `UPDATE topics SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND created_by = ? AND status = 'ACTIVE'`,
    [topicId, userId],
  );
  return result.affectedRows > 0;
}
