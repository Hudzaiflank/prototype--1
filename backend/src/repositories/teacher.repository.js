import { pool } from "../config/database.js";

export async function createTeacher({
  schoolId,
  fullName,
  nip,
  email,
  passwordHash,
}) {
  const [result] = await pool.execute(
    `INSERT INTO users (school_id, role, full_name, nip, email, password_hash)
		 VALUES (?, 'TEACHER', ?, ?, ?, ?)`,
    [schoolId, fullName, nip, email, passwordHash],
  );
  return { id: result.insertId, fullName, nip, email };
}

export async function listTeachers({
  schoolId,
  offset,
  limit,
  search,
  status,
}) {
  const filters = ["school_id = ?", "role = 'TEACHER'"];
  const values = [schoolId];
  if (search) {
    filters.push("(full_name LIKE ? OR nip LIKE ? OR email LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    filters.push("status = ?");
    values.push(status);
  }
  const where = filters.join(" AND ");
  const [rows] = await pool.execute(
    `SELECT id, full_name AS fullName, nip, email, status, created_at AS createdAt
     FROM users WHERE ${where} ORDER BY full_name LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users WHERE ${where}`,
    values,
  );
  return { rows, total: countRows[0].total };
}

export async function getTeacherDetail(teacherId, schoolId) {
  const [teachers] = await pool.execute(
    `SELECT id, full_name AS fullName, nip, email, status, created_at AS createdAt FROM users
     WHERE id = ? AND school_id = ? AND role = 'TEACHER' LIMIT 1`,
    [teacherId, schoolId],
  );
  if (!teachers.length) return null;
  const [classes] = await pool.execute(
    `SELECT c.id, c.name, c.status FROM teacher_classes tc JOIN classes c ON c.id = tc.class_id
     WHERE tc.teacher_id = ? AND tc.unassigned_at IS NULL ORDER BY c.name`,
    [teacherId],
  );
  return { ...teachers[0], classes };
}

export async function removeAssignment({ teacherId, classId, schoolId }) {
  const [result] = await pool.execute(
    `UPDATE teacher_classes tc JOIN users t ON t.id = tc.teacher_id JOIN classes c ON c.id = tc.class_id
     SET tc.unassigned_at = CURRENT_TIMESTAMP WHERE tc.teacher_id = ? AND tc.class_id = ?
     AND t.school_id = ? AND c.school_id = ? AND tc.unassigned_at IS NULL`,
    [teacherId, classId, schoolId, schoolId],
  );
  return result.affectedRows > 0;
}

export async function assignTeacher({ teacherId, classId, schoolId }) {
  const [restored] = await pool.execute(
    `UPDATE teacher_classes tc JOIN users t ON t.id = tc.teacher_id JOIN classes c ON c.id = tc.class_id
     SET tc.unassigned_at = NULL, tc.assigned_at = CURRENT_TIMESTAMP
     WHERE tc.teacher_id = ? AND tc.class_id = ? AND t.school_id = ? AND c.school_id = ? AND tc.unassigned_at IS NOT NULL`,
    [teacherId, classId, schoolId, schoolId],
  );
  if (restored.affectedRows) return true;
  const [result] = await pool.execute(
    `INSERT INTO teacher_classes (teacher_id, class_id)
		 SELECT t.id, c.id FROM users t JOIN classes c ON c.id = ?
		 WHERE t.id = ? AND t.school_id = ? AND t.role = 'TEACHER' AND c.school_id = ?`,
    [classId, teacherId, schoolId, schoolId],
  );
  return result.affectedRows > 0;
}

export async function importTeachers({ schoolId, teachers, actorUserId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const emails = teachers.map((teacher) => teacher.email);
    const placeholders = emails.map(() => "?").join(",");
    const [existing] = await connection.execute(
      `SELECT email FROM users WHERE email IN (${placeholders})`,
      emails,
    );
    if (existing.length) {
      const error = new Error("Teacher email already exists");
      error.code = "TEACHER_DUPLICATE";
      error.statusCode = 409;
      error.details = { emails: existing.map((row) => row.email) };
      throw error;
    }
    const nips = teachers.map((teacher) => teacher.nip);
    const nipPlaceholders = nips.map(() => "?").join(",");
    const [existingNips] = await connection.execute(
      `SELECT nip FROM users WHERE nip IN (${nipPlaceholders})`,
      nips,
    );
    if (existingNips.length) {
      const error = new Error("NIP guru sudah terdaftar");
      error.code = "TEACHER_NIP_DUPLICATE";
      error.statusCode = 409;
      error.details = { nips: existingNips.map((row) => row.nip) };
      throw error;
    }
    for (const teacher of teachers) {
      const [result] = await connection.execute(
        `INSERT INTO users (school_id, role, full_name, nip, email, password_hash)
	 VALUES (?, 'TEACHER', ?, ?, ?, ?)`,
        [
          schoolId,
          teacher.fullName,
          teacher.nip,
          teacher.email,
          teacher.passwordHash,
        ],
      );
      await connection.execute(
        `INSERT INTO audit_logs (actor_user_id, school_id, action, entity_type, entity_id)
	 VALUES (?, ?, 'TEACHER_CREATED', 'USER', ?)`,
        [actorUserId, schoolId, result.insertId],
      );
    }
    await connection.commit();
    return teachers.map(({ fullName, email }) => ({ fullName, email }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findExistingEmails(emails) {
  if (!emails.length) return [];
  const placeholders = emails.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT email FROM users WHERE email IN (${placeholders})`,
    emails,
  );
  return rows.map((row) => row.email);
}

export async function listTeacherEmails(schoolId) {
  const [rows] = await pool.execute(
    "SELECT email FROM users WHERE school_id = ? AND role = 'TEACHER'",
    [schoolId],
  );
  return rows.map((row) => row.email);
}

export async function listTeacherNips() {
  const [rows] = await pool.execute(
    "SELECT nip FROM users WHERE role = 'TEACHER' AND nip IS NOT NULL",
  );
  return rows.map((row) => row.nip);
}
