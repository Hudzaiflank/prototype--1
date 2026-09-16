import { pool } from "../config/database.js";
import {
  createPerfectMatching,
  secureShuffle,
} from "../services/matching.service.js";
import { AppError } from "../utils/errors.js";

async function sessionForUpdate(connection, sessionId, teacherId) {
  const [rows] = await connection.execute(
    `SELECT gs.*, r.status AS room_status, r.created_by AS room_creator
     FROM game_sessions gs LEFT JOIN rooms r ON r.id = gs.room_id
		 WHERE gs.id = ? AND gs.created_by = ? LIMIT 1 FOR UPDATE`,
    [sessionId, teacherId],
  );
  if (!rows.length)
    throw new AppError("Game session not found", "GAME_SESSION_NOT_FOUND", 404);
  return rows[0];
}

export async function startGame(sessionId, teacherId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const session = await sessionForUpdate(connection, sessionId, teacherId);
    if (session.room_id && session.room_status !== "OPEN")
      throw new AppError("Room is closed", "ROOM_NOT_OPEN", 403);
    if (session.status !== "WAITING")
      throw new AppError(
        "Game session cannot be started",
        "INVALID_GAME_STATE",
        409,
      );
    const [participants] = await connection.execute(
      "SELECT id FROM participants WHERE game_session_id = ? ORDER BY id",
      [sessionId],
    );
    const [problems] = await connection.execute(
      "SELECT id, participant_id FROM problems WHERE game_session_id = ? AND status = 'ACTIVE' ORDER BY id",
      [sessionId],
    );
    const matching = createPerfectMatching(participants, problems);
    const groupCount = session.game_mode === "GROUPS" ? session.group_count : 1;
    if (!groupCount || groupCount > participants.length)
      throw new AppError("Invalid group count", "INVALID_GROUP_COUNT", 409);

    const groupIds = [];
    for (let index = 0; index < groupCount; index += 1) {
      const [result] = await connection.execute(
        "INSERT INTO `groups` (game_session_id, group_number, status) VALUES (?, ?, 'PLAYING')",
        [sessionId, index + 1],
      );
      groupIds.push(result.insertId);
    }
    const participantGroup = new Map();
    const groupTurnNumbers = new Map(groupIds.map((groupId) => [groupId, 0]));
    for (const [index, participant] of secureShuffle(participants).entries()) {
      const groupId = groupIds[index % groupCount];
      participantGroup.set(participant.id, groupId);
      await connection.execute(
        "INSERT INTO group_members (group_id, participant_id) VALUES (?, ?)",
        [groupId, participant.id],
      );
    }
    for (const assignment of matching) {
      const groupId = participantGroup.get(assignment.participantId);
      const turnNumber = groupTurnNumbers.get(groupId) + 1;
      groupTurnNumbers.set(groupId, turnNumber);
      const isFirstTurn = turnNumber === 1;
      const [result] = await connection.execute(
        `INSERT INTO assignments (game_session_id, group_id, participant_id, problem_id, sequence_number, status)
				 VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [
          sessionId,
          groupId,
          assignment.participantId,
          assignment.problemId,
          assignment.sequenceNumber,
        ],
      );
      await connection.execute(
        `INSERT INTO game_turns (game_session_id, group_id, assignment_id, turn_number, status)
				 VALUES (?, ?, ?, ?, ?)`,
        [
          sessionId,
          groupId,
          result.insertId,
          turnNumber,
          isFirstTurn ? "ACTIVE" : "PENDING",
        ],
      );
      if (isFirstTurn) {
        await connection.execute(
          "UPDATE assignments SET status = 'ACTIVE' WHERE id = ?",
          [result.insertId],
        );
        const [turn] = await connection.execute(
          "SELECT id FROM game_turns WHERE assignment_id = ? LIMIT 1",
          [result.insertId],
        );
        await connection.execute(
          "UPDATE `groups` SET active_turn_id = ? WHERE id = ?",
          [turn[0].id, groupId],
        );
      }
    }
    await connection.execute(
      "UPDATE game_sessions SET status = 'PLAYING', state_version = state_version + 1, started_at = NOW(), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [sessionId],
    );
    await connection.commit();
    return getGameSession(sessionId, teacherId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function transition(
  sessionId,
  teacherId,
  fromStatuses,
  toStatus,
  timestampColumn,
) {
  const [result] = await pool.execute(
    `UPDATE game_sessions SET status = ?, state_version = state_version + 1, ${timestampColumn} = NOW(), updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND created_by = ? AND status IN (${fromStatuses.map(() => "?").join(",")})`,
    [toStatus, sessionId, teacherId, ...fromStatuses],
  );
  if (!result.affectedRows)
    throw new AppError(
      "Invalid game state or session ownership",
      "INVALID_GAME_STATE",
      409,
    );
  return getGameSession(sessionId, teacherId);
}

export const pauseGame = (sessionId, teacherId) =>
  transition(sessionId, teacherId, ["PLAYING"], "PAUSED", "paused_at");
export const resumeGame = (sessionId, teacherId) =>
  transition(sessionId, teacherId, ["PAUSED"], "PLAYING", "resumed_at");
export const finishGame = (sessionId, teacherId) =>
  transition(
    sessionId,
    teacherId,
    ["PLAYING", "PAUSED"],
    "FINISHED",
    "finished_at",
  ).then(async (state) => {
    await pool.execute(
      `UPDATE rooms r JOIN game_sessions gs ON gs.room_id = r.id
       SET r.status = 'CLOSED', r.closed_at = NOW()
       WHERE gs.id = ? AND gs.created_by = ? AND r.status = 'OPEN'`,
      [sessionId, teacherId],
    );
    return state;
  });

export async function getGameSession(sessionId, teacherId) {
  const [sessions] = await pool.execute(
    `SELECT gs.id, gs.room_id AS roomId, r.code AS roomCode, gs.status, gs.state_version AS stateVersion, gs.input_mode AS inputMode,
			gs.game_mode AS gameMode, gs.problem_display_limit AS problemDisplayLimit,
			gs.group_count AS groupCount, gs.started_at AS startedAt, gs.paused_at AS pausedAt,
			gs.resumed_at AS resumedAt, gs.finished_at AS finishedAt
     FROM game_sessions gs LEFT JOIN rooms r ON r.id = gs.room_id
     WHERE gs.id = ? AND gs.created_by = ? LIMIT 1`,
    [sessionId, teacherId],
  );
  if (!sessions.length)
    throw new AppError("Game session not found", "GAME_SESSION_NOT_FOUND", 404);
  const [participants] = await pool.execute(
    `SELECT id, session_uuid AS sessionId, full_name AS fullName, status, joined_at AS joinedAt
		 FROM participants WHERE game_session_id = ? ORDER BY joined_at`,
    [sessionId],
  );
  const [assignments] = await pool.execute(
    `SELECT a.id, a.participant_id AS participantId, a.problem_id AS problemId,
			a.sequence_number AS sequenceNumber, a.status, p.content, p.participant_id AS problemAuthorId
		 FROM assignments a JOIN problems p ON p.id = a.problem_id
		 WHERE a.game_session_id = ? ORDER BY a.sequence_number`,
    [sessionId],
  );
  return { ...sessions[0], participants, assignments };
}

export async function updateGameConfiguration(
  sessionId,
  teacherId,
  configuration,
) {
  const [result] = await pool.execute(
    `UPDATE game_sessions gs
	 JOIN rooms r ON r.id = gs.room_id
	 JOIN classes c ON c.id = r.class_id
	 LEFT JOIN topics t ON t.id = ?
     SET gs.topic_id = ?, gs.input_mode = ?, gs.game_mode = ?, gs.state_version = gs.state_version + 1,
			 gs.problem_display_limit = ?, gs.group_count = ?, gs.updated_at = CURRENT_TIMESTAMP
	 WHERE gs.id = ? AND gs.created_by = ? AND gs.status = 'WAITING'
		 AND (? IS NULL OR t.school_id = c.school_id)`,
    [
      configuration.topicId ?? null,
      configuration.topicId ?? null,
      configuration.inputMode,
      configuration.gameMode,
      configuration.problemDisplayLimit,
      configuration.groupCount ?? null,
      sessionId,
      teacherId,
      configuration.topicId ?? null,
    ],
  );
  if (!result.affectedRows)
    throw new AppError(
      "Game configuration is locked or not found",
      "GAME_CONFIG_LOCKED",
      409,
    );
  return getGameSession(sessionId, teacherId);
}

export async function getStudentGameState(sessionId, participantId) {
  const [sessions] = await pool.execute(
    `SELECT gs.id, gs.status, gs.state_version AS stateVersion, gs.game_mode AS gameMode,
       gs.problem_display_limit AS problemDisplayLimit, t.title AS topicTitle
		 FROM game_sessions gs LEFT JOIN topics t ON t.id = gs.topic_id
       WHERE gs.id = ? LIMIT 1`,
    [sessionId],
  );
  if (!sessions.length)
    throw new AppError("Game session not found", "GAME_SESSION_NOT_FOUND", 404);
  const [participant] = await pool.execute(
    `SELECT id, full_name AS fullName, status FROM participants
		 WHERE id = ? AND game_session_id = ? LIMIT 1`,
    [participantId, sessionId],
  );
  if (!participant.length)
    throw new AppError("Participant not found", "PARTICIPANT_NOT_FOUND", 404);
  const [groups] = await pool.execute(
    `SELECT g.id, g.group_number AS groupNumber, g.status, g.active_turn_id AS activeTurnId
     FROM \`groups\` g JOIN group_members gm ON gm.group_id = g.id
     WHERE g.game_session_id = ? AND gm.participant_id = ? LIMIT 1`,
    [sessionId, participantId],
  );
  const [members] = groups.length
    ? await pool.execute(
        `SELECT p.id, p.full_name AS fullName, p.status FROM group_members gm
         JOIN participants p ON p.id = gm.participant_id WHERE gm.group_id = ? ORDER BY p.full_name`,
        [groups[0].id],
      )
    : [[]];
  const [turns] = await pool.execute(
    `SELECT gt.id, gt.group_id AS groupId, gt.turn_number AS turnNumber, gt.status,
      gt.participant_card_state AS participantCardState, gt.problem_card_state AS problemCardState,
      p.full_name AS participantName, pr.content AS problemContent
     FROM game_turns gt JOIN group_members gm ON gm.group_id = gt.group_id
     JOIN assignments a ON a.id = gt.assignment_id
     JOIN participants p ON p.id = a.participant_id
     JOIN problems pr ON pr.id = a.problem_id
		 WHERE gt.game_session_id = ? AND gm.participant_id = ? AND gt.status IN ('ACTIVE', 'PENDING')
		 ORDER BY gt.turn_number LIMIT 1`,
    [sessionId, participantId],
  );
  return {
    ...sessions[0],
    participant: {
      fullName: participant[0].fullName,
      status: participant[0].status,
    },
    group: groups.length
      ? {
          groupNumber: groups[0].groupNumber,
          status: groups[0].status,
          members: members.map(({ fullName, status }) => ({
            fullName,
            status,
          })),
        }
      : null,
    currentTurn: turns[0]
      ? {
          id: turns[0].id,
          turnNumber: turns[0].turnNumber,
          status: turns[0].status,
          participantName: turns[0].participantName,
          problemContent: turns[0].problemContent,
          participantCardState: turns[0].participantCardState,
          problemCardState: turns[0].problemCardState,
        }
      : null,
  };
}

async function lockTurnContext(
  connection,
  sessionId,
  groupId,
  turnId,
  teacherId,
) {
  const [groups] = await connection.execute(
    "SELECT g.id, g.active_turn_id AS activeTurnId, gs.status AS sessionStatus FROM `groups` g JOIN game_sessions gs ON gs.id = g.game_session_id WHERE g.id = ? AND g.game_session_id = ? AND gs.created_by = ? FOR UPDATE",
    [groupId, sessionId, teacherId],
  );
  if (!groups.length)
    throw new AppError("Group not found", "GROUP_NOT_FOUND", 404);
  const [turns] = await connection.execute(
    `SELECT gt.*, a.id AS assignment_id, a.participant_id, a.problem_id,
			p.full_name AS participant_name, pr.content AS problem_content
		 FROM game_turns gt JOIN assignments a ON a.id = gt.assignment_id
		 JOIN participants p ON p.id = a.participant_id
		 JOIN problems pr ON pr.id = a.problem_id
		 WHERE gt.id = ? AND gt.group_id = ? AND gt.game_session_id = ? LIMIT 1 FOR UPDATE`,
    [turnId, groupId, sessionId],
  );
  if (!turns.length)
    throw new AppError("Turn not found", "TURN_NOT_FOUND", 404);
  if (groups[0].sessionStatus !== "PLAYING")
    throw new AppError("Game is not playing", "INVALID_GAME_STATE", 409);
  if (
    Number(groups[0].activeTurnId) !== Number(turnId) ||
    turns[0].status !== "ACTIVE"
  )
    throw new AppError("Turn is not active", "TURN_NOT_ACTIVE", 409);
  return { group: groups[0], turn: turns[0] };
}

const publicTurn = (turn) => ({
  id: turn.id,
  groupId: turn.group_id,
  turnNumber: turn.turn_number,
  participant: { displayName: turn.participant_name },
  problem: { content: turn.problem_content },
  participantCardState: turn.participant_card_state,
  problemCardState: turn.problem_card_state,
});

export async function revealCards(sessionId, groupId, turnId, teacherId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { turn } = await lockTurnContext(
      connection,
      sessionId,
      groupId,
      turnId,
      teacherId,
    );
    if (
      turn.participant_card_state !== "HIDDEN" ||
      turn.problem_card_state !== "HIDDEN"
    )
      throw new AppError(
        "Cards are already revealed",
        "CARDS_ALREADY_REVEALED",
        409,
      );
    await connection.execute(
      `UPDATE game_turns SET participant_card_state = 'REVEALED', problem_card_state = 'REVEALED', revealed_at = NOW()
			 WHERE id = ?`,
      [turnId],
    );
    await connection.execute(
      "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
      [sessionId],
    );
    await connection.commit();
    return publicTurn({
      ...turn,
      participant_card_state: "REVEALED",
      problem_card_state: "REVEALED",
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function completeTurn(sessionId, groupId, turnId, teacherId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { turn } = await lockTurnContext(
      connection,
      sessionId,
      groupId,
      turnId,
      teacherId,
    );
    await connection.execute(
      "UPDATE assignments SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?",
      [turn.assignment_id],
    );
    await connection.execute(
      "UPDATE game_turns SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?",
      [turnId],
    );
    const [next] = await connection.execute(
      `SELECT gt.id, gt.turn_number, gt.assignment_id FROM game_turns gt
			 WHERE gt.group_id = ? AND gt.status = 'PENDING' ORDER BY gt.turn_number LIMIT 1 FOR UPDATE`,
      [groupId],
    );
    let nextTurn = null;
    if (next.length) {
      await connection.execute(
        "UPDATE game_turns SET status = 'ACTIVE', started_at = NOW() WHERE id = ?",
        [next[0].id],
      );
      await connection.execute(
        "UPDATE assignments SET status = 'ACTIVE' WHERE id = ?",
        [next[0].assignment_id],
      );
      await connection.execute(
        "UPDATE `groups` SET active_turn_id = ?, status = 'PLAYING' WHERE id = ?",
        [next[0].id, groupId],
      );
      nextTurn = next[0];
    } else {
      await connection.execute(
        "UPDATE `groups` SET active_turn_id = NULL, status = 'FINISHED' WHERE id = ?",
        [groupId],
      );
    }
    const [remaining] = await connection.execute(
      "SELECT COUNT(*) AS count FROM `groups` WHERE game_session_id = ? AND status != 'FINISHED'",
      [sessionId],
    );
    let sessionFinished = false;
    if (remaining[0].count === 0) sessionFinished = true;
    if (sessionFinished) {
      await connection.execute(
        "UPDATE game_sessions SET status = 'FINISHED', state_version = state_version + 1, finished_at = NOW() WHERE id = ?",
        [sessionId],
      );
      await connection.execute(
        `UPDATE rooms r JOIN game_sessions gs ON gs.room_id = r.id
         SET r.status = 'CLOSED', r.closed_at = NOW()
         WHERE gs.id = ? AND r.status = 'OPEN'`,
        [sessionId],
      );
    } else
      await connection.execute(
        "UPDATE game_sessions SET state_version = state_version + 1 WHERE id = ?",
        [sessionId],
      );
    await connection.commit();
    return {
      completedTurn: publicTurn({ ...turn, status: "COMPLETED" }),
      nextTurn,
      sessionFinished,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getCurrentTurn(sessionId, groupId, teacherId) {
  const [rows] = await pool.execute(
    `SELECT gt.id, gt.group_id AS groupId, gt.turn_number AS turnNumber, gt.status,
			gt.participant_card_state AS participantCardState, gt.problem_card_state AS problemCardState,
			p.full_name AS participantName, pr.content AS problemContent, pr.participant_id AS problemAuthorId
		 FROM game_turns gt JOIN game_sessions gs ON gs.id = gt.game_session_id
		 JOIN assignments a ON a.id = gt.assignment_id
		 JOIN participants p ON p.id = a.participant_id
		 JOIN problems pr ON pr.id = a.problem_id
		 WHERE gt.game_session_id = ? AND gt.group_id = ? AND gs.created_by = ?
			 AND gt.status IN ('ACTIVE', 'PENDING') ORDER BY gt.turn_number LIMIT 1`,
    [sessionId, groupId, teacherId],
  );
  if (!rows.length)
    throw new AppError("Current turn not found", "TURN_NOT_FOUND", 404);
  return rows[0];
}

export async function getGroups(sessionId, teacherId) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.group_number AS groupNumber, g.status,
			g.active_turn_id AS activeTurnId, gt.turn_number AS currentTurnNumber,
      (SELECT COUNT(*) FROM game_turns all_turns WHERE all_turns.group_id = g.id) AS totalTurnCount,
      (SELECT COUNT(*) FROM game_turns completed_turns WHERE completed_turns.group_id = g.id AND completed_turns.status = 'COMPLETED') AS completedTurnCount
		 FROM \`groups\` g JOIN game_sessions gs ON gs.id = g.game_session_id
		 LEFT JOIN game_turns gt ON gt.id = g.active_turn_id
		 WHERE g.game_session_id = ? AND gs.created_by = ? ORDER BY g.group_number`,
    [sessionId, teacherId],
  );
  for (const group of rows) {
    const [members] = await pool.execute(
      `SELECT p.id, p.full_name AS fullName, p.status
			 FROM group_members gm JOIN participants p ON p.id = gm.participant_id
			 WHERE gm.group_id = ? ORDER BY p.full_name`,
      [group.id],
    );
    group.members = members;
  }
  return rows;
}

export async function getOwnGroup(sessionId, participantId) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.group_number AS groupNumber, g.status,
			g.active_turn_id AS activeTurnId, gt.turn_number AS currentTurnNumber
		 FROM \`groups\` g JOIN group_members gm ON gm.group_id = g.id
		 LEFT JOIN game_turns gt ON gt.id = g.active_turn_id
		 WHERE g.game_session_id = ? AND gm.participant_id = ? LIMIT 1`,
    [sessionId, participantId],
  );
  if (!rows.length)
    throw new AppError("Group not found", "GROUP_NOT_FOUND", 404);
  const [members] = await pool.execute(
    `SELECT p.id, p.full_name AS fullName, p.status
		 FROM group_members gm JOIN participants p ON p.id = gm.participant_id
		 WHERE gm.group_id = ? ORDER BY p.full_name`,
    [rows[0].id],
  );
  return { ...rows[0], members };
}
