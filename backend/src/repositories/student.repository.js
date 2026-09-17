import { pool } from "../config/database.js";

export async function findStudentsByNisns(nisns, academicYear) {
  if (!nisns.length) return [];
  const [rows] = await pool.query(
    `SELECT s.id, s.nisn, s.full_name AS fullName,
       e.school_id AS schoolId, e.academic_year AS academicYear,
       c.name AS className, c.grade_level AS gradeLevel,
       sc.name AS schoolName, sc.level AS schoolLevel,
       e.status AS enrollmentStatus
     FROM students s LEFT JOIN class_enrollments e
       ON e.student_id = s.id AND e.status = 'ACTIVE' AND e.academic_year = ?
     LEFT JOIN classes c ON c.id = e.class_id
     LEFT JOIN schools sc ON sc.id = e.school_id
     WHERE s.nisn IN (?)`,
    [academicYear, nisns],
  );
  return rows;
}

export async function findLatestStudentEnrollments(studentIds) {
  if (!studentIds.length) return [];
  const [rows] = await pool.query(
    `SELECT s.id AS studentId, c.grade_level AS gradeLevel,
       c.name AS className, c.status AS classStatus,
       sc.name AS schoolName, sc.level AS schoolLevel,
       e.academic_year AS academicYear, e.status AS enrollmentStatus
     FROM students s
     JOIN class_enrollments e ON e.student_id = s.id
     JOIN classes c ON c.id = e.class_id
     JOIN schools sc ON sc.id = e.school_id
     WHERE s.id IN (?)
       AND e.id = (
         SELECT MAX(previous.id) FROM class_enrollments previous
         WHERE previous.student_id = s.id
       )`,
    [studentIds],
  );
  return rows;
}

export async function createClassWithStudents({ schoolId, gradeLevel, major, classNumber, academicYear, students }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [schools] = await connection.execute("SELECT level FROM schools WHERE id = ? FOR UPDATE", [schoolId]);
    if (!schools.length) throw new Error("School not found");
    const allowedGrades = schools[0].level === "SMP" ? ["7", "8", "9"] : ["10", "11", "12"];
    if (!allowedGrades.includes(String(gradeLevel))) throw new Error("Tingkat tidak sesuai dengan jenjang sekolah");
    if (schools[0].level === "SMP" && major) throw new Error("SMP tidak memiliki jurusan");
    if (schools[0].level !== "SMP" && !major) throw new Error("Jurusan wajib diisi untuk SMA/SMK");
    const [classResult] = await connection.execute(
      `INSERT INTO classes (school_id, academic_year, grade_level, major, class_number, name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [schoolId, academicYear, gradeLevel, major, classNumber, `${gradeLevel}-${major || "UMUM"}-${classNumber}`],
    );
    for (const student of students) {
      const [existing] = await connection.execute("SELECT id FROM students WHERE nisn = ? LIMIT 1", [student.nisn]);
      let studentId = existing[0]?.id;
      if (!studentId) {
        const [studentResult] = await connection.execute(
          "INSERT INTO students (nisn, full_name) VALUES (?, ?)",
          [student.nisn, student.fullName],
        );
        studentId = studentResult.insertId;
      }
      await connection.execute(
        `INSERT INTO class_enrollments (student_id, class_id, school_id, academic_year)
         VALUES (?, ?, ?, ?)`,
        [studentId, classResult.insertId, schoolId, academicYear],
      );
    }
    await connection.commit();
    return { id: classResult.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listClassStudents(classId, schoolId) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.full_name AS fullName, s.nisn, e.status
     FROM class_enrollments e JOIN students s ON s.id = e.student_id
     JOIN classes c ON c.id = e.class_id
     WHERE e.class_id = ? AND e.school_id = ? AND e.status = 'ACTIVE'
     ORDER BY s.full_name, s.nisn`,
    [classId, schoolId],
  );
  return rows;
}

export async function resetClassStudents(classId, schoolId) {
  const [result] = await pool.execute(
    `UPDATE class_enrollments e JOIN classes c ON c.id = e.class_id
     SET e.status = 'INACTIVE', e.updated_at = CURRENT_TIMESTAMP
     WHERE e.class_id = ? AND c.school_id = ? AND e.status = 'ACTIVE'`,
    [classId, schoolId],
  );
  const [classRows] = await pool.execute("SELECT id FROM classes WHERE id = ? AND school_id = ?", [classId, schoolId]);
  return classRows.length > 0 && result !== undefined;
}

export async function promoteSchool({ schoolId, academicYear, nextAcademicYear }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [schools] = await connection.execute("SELECT level FROM schools WHERE id = ? FOR UPDATE", [schoolId]);
    if (!schools.length) return null;
    const terminal = schools[0].level === "SMP" ? "9" : "12";
    const increment = (grade) => String(Number(grade) + 1);
    const [classes] = await connection.execute(
      "SELECT * FROM classes WHERE school_id = ? AND academic_year = ? AND status = 'ACTIVE' FOR UPDATE",
      [schoolId, academicYear],
    );
    for (const current of classes) {
      const targetGrade = increment(current.grade_level);
      if (current.grade_level === terminal) {
        await connection.execute("UPDATE classes SET status = 'INACTIVE' WHERE id = ?", [current.id]);
        await connection.execute("UPDATE class_enrollments SET status = 'INACTIVE' WHERE class_id = ? AND status = 'ACTIVE'", [current.id]);
        continue;
      }
      let [targets] = await connection.execute(
        "SELECT id FROM classes WHERE school_id = ? AND academic_year = ? AND grade_level = ? AND major = ? AND class_number = ? LIMIT 1",
        [schoolId, nextAcademicYear, targetGrade, current.major, current.class_number],
      );
      let targetId = targets[0]?.id;
      if (!targetId) {
        const [result] = await connection.execute(
          `INSERT INTO classes (school_id, academic_year, grade_level, major, class_number, name)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [schoolId, nextAcademicYear, targetGrade, current.major, current.class_number, `${targetGrade}-${current.major || "UMUM"}-${current.class_number}`],
        );
        targetId = result.insertId;
      }
      await connection.execute(
        `INSERT IGNORE INTO teacher_classes (teacher_id, class_id, assigned_at)
         SELECT teacher_id, ?, assigned_at FROM teacher_classes WHERE class_id = ? AND unassigned_at IS NULL`,
        [targetId, current.id],
      );
      await connection.execute("UPDATE teacher_classes SET unassigned_at = NOW() WHERE class_id = ? AND unassigned_at IS NULL", [current.id]);
      await connection.execute(
        `INSERT INTO class_enrollments (student_id, class_id, school_id, academic_year)
         SELECT student_id, ?, school_id, ? FROM class_enrollments
         WHERE class_id = ? AND academic_year = ? AND status = 'ACTIVE'
         ON DUPLICATE KEY UPDATE status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP`,
        [targetId, nextAcademicYear, current.id, academicYear],
      );
      await connection.execute(
        `UPDATE class_enrollments SET status = 'INACTIVE' WHERE class_id = ? AND status = 'ACTIVE'`,
        [current.id],
      );
      await connection.execute("UPDATE classes SET status = 'INACTIVE' WHERE id = ?", [current.id]);
    }
    await connection.commit();
    return { academicYear, nextAcademicYear, promoted: classes.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function resetLevel({ schoolId, academicYear, gradeLevel }) {
  const [result] = await pool.execute(
    `UPDATE class_enrollments e JOIN classes c ON c.id = e.class_id
     SET e.status = 'INACTIVE', e.updated_at = CURRENT_TIMESTAMP
     WHERE c.school_id = ? AND c.academic_year = ? AND c.grade_level = ? AND e.status = 'ACTIVE'`,
    [schoolId, academicYear, gradeLevel],
  );
  return { released: result.affectedRows };
}

export async function listStudents(schoolId = null) {
  const values = [];
  const scope = schoolId ? "WHERE e.school_id = ? AND e.status = 'ACTIVE'" : "WHERE e.status = 'ACTIVE'";
  if (schoolId) values.push(schoolId);
  const [rows] = await pool.execute(
    `SELECT DISTINCT s.id, s.nisn, s.full_name AS fullName
     FROM students s JOIN class_enrollments e ON e.student_id = s.id ${scope}
     ORDER BY s.full_name, s.nisn`,
    values,
  );
  return rows;
}

export async function getStudentHistory({ studentId, schoolId = null }) {
  const values = [studentId];
  const scope = schoolId ? "AND c.school_id = ?" : "";
  if (schoolId) values.push(schoolId);
  const [studentRows] = await pool.execute("SELECT id, nisn, full_name AS fullName FROM students WHERE id = ?", [studentId]);
  if (!studentRows.length) return null;
  const [rows] = await pool.execute(
    `SELECT c.id AS classId, c.name AS className, c.academic_year AS academicYear,
       sc.name AS schoolName, gs.id AS gameSessionId, gs.created_at AS playedAt,
       pr.content AS problemContent
     FROM participants p JOIN game_sessions gs ON gs.id = p.game_session_id
     JOIN classes c ON c.id = COALESCE(gs.class_id, (SELECT class_id FROM rooms WHERE id = gs.room_id))
     JOIN schools sc ON sc.id = c.school_id
     JOIN problems pr ON pr.participant_id = p.id
     WHERE p.student_id = ? ${scope}
     ORDER BY gs.created_at DESC`,
    values,
  );
  return { student: studentRows[0], history: rows };
}