import { pool } from "../config/database.js";

export async function getSuperAdminDashboard() {
  const [[totals]] = await pool.query(`
  SELECT
   (SELECT COUNT(*) FROM schools) AS totalSchools,
   (SELECT COUNT(*) FROM schools WHERE status = 'ACTIVE') AS activeSchools,
   (SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE') AS totalAdmins,
   (SELECT COUNT(*) FROM users WHERE role = 'TEACHER' AND status = 'ACTIVE') AS totalTeachers,
  (SELECT COUNT(*) FROM classes WHERE status = 'ACTIVE') AS totalClasses,
  (SELECT COUNT(*) FROM rooms WHERE status = 'CLOSED') AS totalFinishedGames
 `);
  return totals;
}

export async function getAdminDashboard(schoolId) {
  const [[school]] = await pool.execute(
    "SELECT id, name, domain, status FROM schools WHERE id = ?",
    [schoolId],
  );
  const [[counts]] = await pool.execute(
    `
  SELECT
   (SELECT COUNT(*) FROM classes WHERE school_id = ? AND status = 'ACTIVE') AS classCount,
   (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'TEACHER' AND status = 'ACTIVE') AS teacherCount,
  (SELECT COUNT(*) FROM rooms r JOIN classes c ON c.id = r.class_id WHERE c.school_id = ? AND r.status = 'OPEN') AS activeRoomCount,
  (SELECT COUNT(*) FROM rooms r JOIN classes c ON c.id = r.class_id WHERE c.school_id = ? AND r.status = 'CLOSED') AS completedRoomCount
 `,
   [schoolId, schoolId, schoolId, schoolId],
  );
  const [recentGames] = await pool.execute(
    `
  SELECT gs.id, gs.status, gs.created_at AS createdAt, r.code AS roomCode
  FROM game_sessions gs JOIN rooms r ON r.id = gs.room_id JOIN classes c ON c.id = r.class_id
  WHERE c.school_id = ? ORDER BY gs.created_at DESC LIMIT 10
 `,
    [schoolId],
  );
  return { school, ...counts, recentGames };
}

export async function getTeacherDashboard(teacherId, schoolId) {
  const [classes] = await pool.execute(
    `
  SELECT c.id, c.name, c.status FROM teacher_classes tc JOIN classes c ON c.id = tc.class_id
  WHERE tc.teacher_id = ? AND c.school_id = ? AND tc.unassigned_at IS NULL ORDER BY c.name
 `,
    [teacherId, schoolId],
  );
  const [activeRooms] = await pool.execute(
    `
  SELECT r.id, r.code, r.status, gs.id AS gameSessionId, gs.status AS gameStatus
  FROM rooms r JOIN classes c ON c.id = r.class_id LEFT JOIN game_sessions gs ON gs.room_id = r.id
  WHERE r.created_by = ? AND c.school_id = ? AND r.status = 'OPEN'
 `,
    [teacherId, schoolId],
  );
  const [pausedGames] = await pool.execute(
    "SELECT id, room_id AS roomId, paused_at AS pausedAt FROM game_sessions WHERE created_by = ? AND status = 'PAUSED' ORDER BY paused_at DESC",
    [teacherId],
  );
  const [[completedRooms]] = await pool.execute(
    "SELECT COUNT(*) AS completedRoomCount FROM rooms r JOIN classes c ON c.id = r.class_id WHERE r.created_by = ? AND c.school_id = ? AND r.status = 'CLOSED'",
    [teacherId, schoolId],
  );
  return { classes, activeRooms, pausedGames, ...completedRooms };
}
