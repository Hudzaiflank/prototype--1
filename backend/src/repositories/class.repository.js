import { pool } from "../config/database.js";

export async function createClass({
  schoolId,
  gradeLevel,
  major,
  classNumber,
}) {
  const name = `${gradeLevel}-${major}-${classNumber}`;
  const [result] = await pool.execute(
    "INSERT INTO classes (school_id, grade_level, major, class_number, name) VALUES (?, ?, ?, ?, ?)",
    [schoolId, gradeLevel, major, classNumber, name],
  );
  return findClass(result.insertId, schoolId);
}

export async function listClasses(schoolId, teacherId = null) {
  const assignment = teacherId
    ? "JOIN teacher_classes tc ON tc.class_id = c.id AND tc.teacher_id = ? AND tc.unassigned_at IS NULL"
    : "";
  const values = teacherId ? [teacherId, schoolId] : [schoolId];
  const [rows] = await pool.execute(
    `SELECT c.id, c.grade_level AS gradeLevel, c.major, c.class_number AS classNumber, c.name, c.status
		 FROM classes c ${assignment} WHERE c.school_id = ? ORDER BY c.name`,
    values,
  );
  return rows;
}

export async function findClass(id, schoolId) {
  const [rows] = await pool.execute(
    `SELECT id, school_id AS schoolId, grade_level AS gradeLevel, major,
			class_number AS classNumber, name, status FROM classes WHERE id = ? AND school_id = ? LIMIT 1`,
    [id, schoolId],
  );
  return rows[0] ?? null;
}

export async function getClassDetail(id, schoolId) {
  const classRoom = await findClass(id, schoolId);
  if (!classRoom) return null;
  const [teachers] = await pool.execute(
    `SELECT u.id, u.full_name AS fullName, u.email FROM teacher_classes tc
     JOIN users u ON u.id = tc.teacher_id WHERE tc.class_id = ? AND tc.unassigned_at IS NULL`,
    [id],
  );
  const [rooms] = await pool.execute(
    `SELECT r.id, r.code, r.status, r.created_by AS createdBy, r.opened_at AS openedAt, r.closed_at AS closedAt
     FROM rooms r WHERE r.class_id = ? AND r.status = 'OPEN' ORDER BY r.created_at DESC LIMIT 1`,
    [id],
  );
  return {
    ...classRoom,
    assignedTeachers: teachers,
    currentRoom: rooms[0] ?? null,
  };
}

export async function updateClass({
  id,
  schoolId,
  gradeLevel,
  major,
  classNumber,
  status,
}) {
  const name = `${gradeLevel}-${major}-${classNumber}`;
  const [result] = await pool.execute(
    `UPDATE classes SET grade_level = ?, major = ?, class_number = ?, name = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND school_id = ?`,
    [gradeLevel, major, classNumber, name, status, id, schoolId],
  );
  return result.affectedRows > 0;
}
