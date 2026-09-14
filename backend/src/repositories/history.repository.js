import { pool } from "../config/database.js";

const historySelect = `
	SELECT a.id AS assignmentId, a.sequence_number AS sequenceNumber, a.status AS assignmentStatus,
		p.full_name AS participantName, p.id AS participantId,
		pr.content AS problemContent, pr.participant_id AS problemAuthorId,
		g.id AS groupId, g.group_number AS groupNumber,
		gt.id AS turnId, gt.turn_number AS turnNumber, gt.status AS turnStatus,
		gt.started_at AS turnStartedAt, gt.revealed_at AS turnRevealedAt,
		gt.completed_at AS turnCompletedAt, a.assigned_at AS assignedAt, a.completed_at AS assignmentCompletedAt
`;

export async function getSessionHistory(sessionId, teacherId) {
  const [rows] = await pool.execute(
    `${historySelect}
		 FROM assignments a JOIN game_sessions gs ON gs.id = a.game_session_id
		 JOIN participants p ON p.id = a.participant_id
		 JOIN problems pr ON pr.id = a.problem_id
		 LEFT JOIN \`groups\` g ON g.id = a.group_id
		 LEFT JOIN game_turns gt ON gt.assignment_id = a.id
		 WHERE a.game_session_id = ? AND gs.created_by = ? ORDER BY a.sequence_number`,
    [sessionId, teacherId],
  );
  return rows;
}

export async function listTeacherHistory({
  teacherId,
  offset,
  limit,
  classId,
  from,
  to,
}) {
  const filters = ["gs.created_by = ?"];
  const values = [teacherId];
  if (classId) {
    filters.push("r.class_id = ?");
    values.push(classId);
  }
  if (from) {
    filters.push("gs.created_at >= ?");
    values.push(`${from} 00:00:00`);
  }
  if (to) {
    filters.push("gs.created_at <= ?");
    values.push(`${to} 23:59:59`);
  }
  const where = filters.join(" AND ");
  const [rows] = await pool.execute(
    `SELECT gs.id AS sessionId, gs.status, gs.created_at AS createdAt, gs.started_at AS startedAt,
			gs.finished_at AS finishedAt, r.id AS roomId, r.code AS roomCode,
			c.id AS classId, c.name AS className,
			COUNT(DISTINCT p.id) AS participantCount
		 FROM game_sessions gs JOIN rooms r ON r.id = gs.room_id
		 JOIN classes c ON c.id = r.class_id
		 LEFT JOIN participants p ON p.game_session_id = gs.id
		 WHERE ${where}
		 GROUP BY gs.id ORDER BY gs.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM game_sessions gs JOIN rooms r ON r.id = gs.room_id WHERE ${where}`,
    values,
  );
  return { rows, total: countRows[0].total };
}
