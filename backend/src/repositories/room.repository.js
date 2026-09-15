import { pool } from "../config/database.js";
import { generateRoomCode } from "../utils/roomCode.js";

export async function openRoom({ classId, teacherId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [classes] = await connection.execute(
      `SELECT c.id FROM classes c JOIN teacher_classes tc ON tc.class_id = c.id
			 WHERE c.id = ? AND tc.teacher_id = ? AND tc.unassigned_at IS NULL FOR UPDATE`,
      [classId, teacherId],
    );
    if (!classes.length) return null;
    const [active] = await connection.execute(
      "SELECT id FROM rooms WHERE class_id = ? AND status = 'OPEN' LIMIT 1 FOR UPDATE",
      [classId],
    );
    if (active.length) return { conflict: true };
    let code;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateRoomCode();
      const [existing] = await connection.execute(
        "SELECT id FROM rooms WHERE code = ?",
        [candidate],
      );
      if (!existing.length) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Could not generate unique room code");
    const [result] = await connection.execute(
      "INSERT INTO rooms (class_id, created_by, code, status, opened_at) VALUES (?, ?, ?, 'OPEN', NOW())",
      [classId, teacherId, code],
    );
    await connection.commit();
    return { id: result.insertId, classId, code, status: "OPEN" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeRoom(roomId, teacherId) {
  const [result] = await pool.execute(
    `UPDATE rooms SET status = 'CLOSED', closed_at = NOW()
		 WHERE id = ? AND created_by = ? AND status = 'OPEN'`,
    [roomId, teacherId],
  );
  return result.affectedRows > 0;
}

export async function createGameSession({
  roomId,
  teacherId,
  topicId,
  inputMode,
  gameMode,
  problemDisplayLimit,
  groupCount,
  expiresAt,
}) {
  const [result] = await pool.execute(
    `INSERT INTO game_sessions (room_id, created_by, topic_id, input_mode, game_mode, problem_display_limit, group_count, expires_at)
     SELECT r.id, ?, ?, ?, ?, ?, ?, ? FROM rooms r JOIN classes c ON c.id = r.class_id
     LEFT JOIN topics t ON t.id = ?
     WHERE r.id = ? AND r.created_by = ? AND r.status = 'OPEN'
       AND (? IS NULL OR t.school_id = c.school_id)
       AND NOT EXISTS (
         SELECT 1 FROM game_sessions active
         WHERE active.room_id = r.id
           AND active.status IN ('WAITING', 'PLAYING', 'PAUSED')
       )`,
    [
      teacherId,
      topicId ?? null,
      inputMode,
      gameMode,
      problemDisplayLimit,
      groupCount ?? null,
      expiresAt,
      topicId ?? null,
      roomId,
      teacherId,
      topicId ?? null,
    ],
  );
  return result.affectedRows
    ? { id: result.insertId, roomId, status: "WAITING" }
    : null;
}

export async function findRoomByCode(code) {
  const [rows] = await pool.execute(
    `SELECT r.id AS roomId, r.code, r.status AS roomStatus, gs.id AS gameSessionId
		 FROM rooms r LEFT JOIN game_sessions gs ON gs.room_id = r.id AND gs.status IN ('WAITING', 'PLAYING', 'PAUSED')
		 WHERE r.code = ? ORDER BY gs.created_at DESC LIMIT 1`,
    [code],
  );
  return rows[0] ?? null;
}

export async function registerParticipant({
  sessionId,
  gameSessionId,
  fullName,
}) {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute(
      "SELECT id, session_uuid AS sessionId, full_name AS fullName, status FROM participants WHERE game_session_id = ? AND session_uuid = ?",
      [gameSessionId, sessionId],
    );
    if (existing.length) {
      await connection.execute(
        "UPDATE participants SET status = 'CONNECTED', connected_at = NOW() WHERE id = ?",
        [existing[0].id],
      );
      await connection.execute(
        "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
        [gameSessionId],
      );
      return existing[0];
    }
    const [result] = await connection.execute(
      `INSERT INTO participants (game_session_id, session_uuid, full_name, status, connected_at)
			 SELECT id, ?, ?, 'CONNECTED', NOW() FROM game_sessions WHERE id = ? AND status = 'WAITING'`,
      [sessionId, fullName, gameSessionId],
    );
    if (!result.affectedRows) return null;
    await connection.execute(
      "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
      [gameSessionId],
    );
    return { id: result.insertId, sessionId, fullName, status: "CONNECTED" };
  } finally {
    connection.release();
  }
}

export async function registerTeacherParticipant({
  sessionId,
  fullName,
  content,
  teacherId,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [sessions] = await connection.execute(
      "SELECT id FROM game_sessions WHERE id = ? AND created_by = ? AND status = 'WAITING' AND input_mode = 'TEACHER' LIMIT 1 FOR UPDATE",
      [sessionId, teacherId],
    );
    if (!sessions.length) return null;
    const [participantResult] = await connection.execute(
      "INSERT INTO participants (game_session_id, session_uuid, full_name, status, connected_at) VALUES (?, UUID(), ?, 'CONNECTED', NOW())",
      [sessionId, fullName],
    );
    if (content) {
      await connection.execute(
        "INSERT INTO problems (game_session_id, participant_id, created_by, content, source) VALUES (?, ?, ?, ?, 'TEACHER')",
        [sessionId, participantResult.insertId, teacherId, content],
      );
    }
    await connection.execute(
      "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
      [sessionId],
    );
    await connection.commit();
    return {
      id: participantResult.insertId,
      fullName,
      problemSubmitted: Boolean(content),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function importTeacherParticipants({ sessionId, teacherId, rows }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [sessions] = await connection.execute(
      "SELECT id FROM game_sessions WHERE id = ? AND created_by = ? AND status = 'WAITING' AND input_mode = 'TEACHER' LIMIT 1 FOR UPDATE",
      [sessionId, teacherId],
    );
    if (!sessions.length) return null;
    for (const row of rows) {
      const [participant] = await connection.execute(
        "INSERT INTO participants (game_session_id, session_uuid, full_name, status, connected_at) VALUES (?, UUID(), ?, 'CONNECTED', NOW())",
        [sessionId, row.fullName],
      );
      await connection.execute(
        "INSERT INTO problems (game_session_id, participant_id, created_by, content, source) VALUES (?, ?, ?, ?, 'TEACHER')",
        [sessionId, participant.insertId, teacherId, row.content],
      );
    }
    await connection.execute(
      "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
      [sessionId],
    );
    await connection.commit();
    return { count: rows.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function submitProblem({
  gameSessionId,
  participantSessionId,
  content,
}) {
  const [result] = await pool.execute(
    `INSERT INTO problems (game_session_id, participant_id, content, source)
     SELECT p.game_session_id, p.id, ?, 'STUDENT' FROM participants p
     JOIN game_sessions gs ON gs.id = p.game_session_id
       WHERE p.game_session_id = ? AND p.session_uuid = ? AND gs.status = 'WAITING' AND gs.input_mode = 'STUDENT' AND NOT EXISTS
			 (SELECT 1 FROM problems prior WHERE prior.game_session_id = ? AND prior.participant_id = p.id)`,
    [content, gameSessionId, participantSessionId, gameSessionId],
  );
  if (result.affectedRows)
    await pool.execute(
      "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
      [gameSessionId],
    );
  return result.affectedRows > 0;
}

export async function getSubmissionProgress(gameSessionId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(DISTINCT p.id) AS participantCount, COUNT(DISTINCT pr.id) AS problemCount
     FROM participants p LEFT JOIN problems pr ON pr.participant_id = p.id AND pr.game_session_id = p.game_session_id
     WHERE p.game_session_id = ?`,
    [gameSessionId],
  );
  return rows[0];
}

export async function submitTeacherProblem({
  sessionId,
  participantId,
  content,
  teacherId,
}) {
  const [result] = await pool.execute(
    `INSERT INTO problems (game_session_id, participant_id, created_by, content, source)
     SELECT gs.id, p.id, gs.created_by, ?, 'TEACHER'
     FROM game_sessions gs JOIN participants p ON p.game_session_id = gs.id
     WHERE gs.id = ? AND gs.created_by = ? AND gs.status = 'WAITING'
       AND gs.input_mode = 'TEACHER' AND p.id = ? AND NOT EXISTS
       (SELECT 1 FROM problems prior WHERE prior.game_session_id = gs.id AND prior.participant_id = p.id)`,
    [content, sessionId, teacherId, participantId],
  );
  if (result.affectedRows)
    await pool.execute(
      "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
      [sessionId],
    );
  return result.affectedRows > 0;
}

export async function findParticipantBySession(gameSessionId, sessionId) {
  const [rows] = await pool.execute(
    `SELECT id, game_session_id AS gameSessionId, session_uuid AS sessionId,
			full_name AS fullName, status FROM participants
		 WHERE game_session_id = ? AND session_uuid = ? LIMIT 1`,
    [gameSessionId, sessionId],
  );
  return rows[0] ?? null;
}

export async function findParticipantGroup(participantId, gameSessionId) {
  const [rows] = await pool.execute(
    `SELECT gm.group_id AS groupId FROM group_members gm
		 JOIN participants p ON p.id = gm.participant_id
		 WHERE gm.participant_id = ? AND p.game_session_id = ? LIMIT 1`,
    [participantId, gameSessionId],
  );
  return rows[0] ?? null;
}

export async function markParticipantDisconnected(participantId) {
  await pool.execute(
    `UPDATE participants p JOIN game_sessions gs ON gs.id = p.game_session_id
     SET p.status = 'DISCONNECTED', p.disconnected_at = NOW(), gs.state_version = gs.state_version + 1
     WHERE p.id = ?`,
    [participantId],
  );
}

export async function getRoomStatus(roomId, teacherId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.code, r.status, r.class_id AS classId, gs.id AS gameSessionId,
     gs.status AS gameStatus, COUNT(p.id) AS participantCount
     FROM rooms r LEFT JOIN game_sessions gs ON gs.room_id = r.id
     LEFT JOIN participants p ON p.game_session_id = gs.id
     WHERE r.id = ? AND r.created_by = ? GROUP BY r.id, gs.id ORDER BY gs.created_at DESC LIMIT 1`,
    [roomId, teacherId],
  );
  return rows[0] ?? null;
}
