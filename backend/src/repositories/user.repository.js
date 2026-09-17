import { pool } from "../config/database.js";

const userColumns = `
	u.id, u.school_id, u.role, u.full_name, u.email, u.password_hash,
  u.status, u.last_login_at, s.name AS school_name, s.level AS school_level, s.status AS school_status
`;

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${userColumns} FROM users u LEFT JOIN schools s ON s.id = u.school_id WHERE u.email = ? LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${userColumns} FROM users u LEFT JOIN schools s ON s.id = u.school_id WHERE u.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function updateLastLogin(id) {
  await pool.execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
    id,
  ]);
}

export async function updatePassword(id, passwordHash) {
  await pool.execute(
    "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [passwordHash, id],
  );
}

export async function storeRefreshToken(userId, tokenHash, expiresAt) {
  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt],
  );
}

export async function findValidRefreshTokens(userId) {
  const [rows] = await pool.execute(
    `SELECT id, token_hash, expires_at FROM refresh_tokens
		 WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
		 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function revokeRefreshToken(id) {
  await pool.execute(
    "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id],
  );
}

export async function revokeAllRefreshTokens(userId) {
  await pool.execute(
    "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL",
    [userId],
  );
}

export async function resetUserPassword({
  userId,
  role,
  schoolId,
  passwordHash,
  actorUserId,
  action,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const lookup = userId
      ? {
          sql: "SELECT id, email FROM users WHERE id = ? AND role = ? AND (? IS NULL OR school_id = ?) LIMIT 1 FOR UPDATE",
          values: [userId, role, schoolId ?? null, schoolId ?? null],
        }
      : {
          sql: "SELECT id, email FROM users WHERE role = ? AND school_id = ? LIMIT 1 FOR UPDATE",
          values: [role, schoolId],
        };
    const [users] = await connection.execute(lookup.sql, lookup.values);
    if (!users.length) return null;
    await connection.execute(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [passwordHash, users[0].id],
    );
    await connection.execute(
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL",
      [users[0].id],
    );
    await connection.execute(
      `INSERT INTO audit_logs (actor_user_id, school_id, action, entity_type, entity_id)
	VALUES (?, ?, ?, 'USER', ?)`,
      [actorUserId, schoolId ?? null, action, users[0].id],
    );
    await connection.commit();
    return users[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
