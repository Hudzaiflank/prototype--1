import { pool } from "../config/database.js";

export async function createSchoolWithAdmin({ school, admin }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [schoolResult] = await connection.execute(
      "INSERT INTO schools (name, level, slug, domain) VALUES (?, ?, ?, NULL)",
      [school.name, school.level, school.slug],
    );
    await connection.execute(
      `INSERT INTO users (school_id, role, full_name, email, password_hash)
			 VALUES (?, 'ADMIN', ?, ?, ?)`,
      [schoolResult.insertId, admin.fullName, admin.email, admin.passwordHash],
    );
    await connection.execute(
      `INSERT INTO audit_logs (actor_user_id, school_id, action, entity_type, entity_id, metadata)
			 VALUES (?, ?, 'SCHOOL_CREATED', 'SCHOOL', ?, JSON_OBJECT('adminEmail', ?))`,
      [
        admin.actorUserId,
        schoolResult.insertId,
        schoolResult.insertId,
        admin.email,
      ],
    );
    await connection.commit();
    return { id: schoolResult.insertId, ...school };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listSchools({ offset, limit, search, status }) {
  const filters = [];
  const values = [];
  if (search) {
    filters.push("s.name LIKE ?");
    values.push(`%${search}%`);
  }
  if (status) {
    filters.push("s.status = ?");
    values.push(status);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT s.id, s.name, s.slug, s.domain, s.status, s.created_at,
			 COUNT(DISTINCT CASE WHEN u.role = 'TEACHER' THEN u.id END) AS teacher_count,
			 COUNT(DISTINCT c.id) AS class_count
		 FROM schools s
		 LEFT JOIN users u ON u.school_id = s.id AND u.status = 'ACTIVE'
		 LEFT JOIN classes c ON c.school_id = s.id AND c.status = 'ACTIVE'
		 ${where}
		 GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM schools s ${where}`,
    values,
  );
  return { rows, total: countRows[0].total };
}

export async function findSchoolDetail(id) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.name, s.slug, s.domain, s.status, s.created_at,
			 u.id AS admin_id, u.full_name AS admin_name, u.email AS admin_email,
			 (SELECT COUNT(*) FROM users t WHERE t.school_id = s.id AND t.role = 'TEACHER' AND t.status = 'ACTIVE') AS teacher_count,
			 (SELECT COUNT(*) FROM classes c WHERE c.school_id = s.id AND c.status = 'ACTIVE') AS class_count
		 FROM schools s LEFT JOIN users u ON u.school_id = s.id AND u.role = 'ADMIN'
		 WHERE s.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function updateSchoolStatus(id, status) {
  const [result] = await pool.execute(
    "UPDATE schools SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, id],
  );
  return result.affectedRows > 0;
}

export async function deleteSchool(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [schools] = await connection.execute(
      "SELECT id FROM schools WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!schools.length) {
      await connection.rollback();
      return false;
    }

    await connection.execute(
      `DELETE FROM audit_logs
       WHERE school_id = ? OR actor_user_id IN
         (SELECT id FROM users WHERE school_id = ?)`,
      [id, id],
    );
    await connection.execute(
      `DELETE rt FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id WHERE u.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE gt FROM game_turns gt
       JOIN game_sessions gs ON gs.id = gt.game_session_id
       JOIN rooms r ON r.id = gs.room_id
       JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE a FROM assignments a
       JOIN game_sessions gs ON gs.id = a.game_session_id
       JOIN rooms r ON r.id = gs.room_id
       JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE gm FROM group_members gm
       JOIN \`groups\` g ON g.id = gm.group_id
       JOIN game_sessions gs ON gs.id = g.game_session_id
       JOIN rooms r ON r.id = gs.room_id
       JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE g FROM \`groups\` g
       JOIN game_sessions gs ON gs.id = g.game_session_id
       JOIN rooms r ON r.id = gs.room_id
       JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE p FROM problems p
       JOIN game_sessions gs ON gs.id = p.game_session_id
       JOIN rooms r ON r.id = gs.room_id
       JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE p FROM participants p
       JOIN game_sessions gs ON gs.id = p.game_session_id
       JOIN rooms r ON r.id = gs.room_id
       JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE gs FROM game_sessions gs
       JOIN rooms r ON r.id = gs.room_id
       JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE r FROM rooms r JOIN classes c ON c.id = r.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute(
      `DELETE tc FROM teacher_classes tc
       JOIN classes c ON c.id = tc.class_id WHERE c.school_id = ?`,
      [id],
    );
    await connection.execute("DELETE FROM topics WHERE school_id = ?", [id]);
    await connection.execute("DELETE FROM classes WHERE school_id = ?", [id]);
    await connection.execute("DELETE FROM users WHERE school_id = ?", [id]);
    await connection.execute("DELETE FROM schools WHERE id = ?", [id]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
