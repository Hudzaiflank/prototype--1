import { pool } from "../config/database.js";
import {
  createPerfectMatching,
  secureShuffle,
} from "../services/matching.service.js";
import { AppError } from "../utils/errors.js";

function bulkInsert(connection, statement, rows) {
  if (!rows.length) return null;
  const placeholders = rows.map(() => `(${rows[0].map(() => "?").join(", ")})`).join(", ");
  return connection.execute(
    `${statement} VALUES ${placeholders}`,
    rows.flat(),
  );
}

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
    if (problems.length !== participants.length)
      throw new AppError(
        "Semua peserta harus memiliki jawaban sebelum permainan dimulai.",
        "INCOMPLETE_SUBMISSIONS",
        409,
      );
    const groupCount = session.game_mode === "GROUPS" ? session.group_count : 1;
    if (!groupCount || groupCount > participants.length)
      throw new AppError("Invalid group count", "INVALID_GROUP_COUNT", 409);
    if (
      session.game_mode === "GROUPS" &&
      groupCount > Math.floor(participants.length / 2)
    )
      throw new AppError(
        "Jumlah kelompok terlalu banyak. Setiap kelompok harus memiliki minimal dua anggota.",
        "INVALID_GROUP_COUNT",
        409,
      );

    const [groupResult] = await bulkInsert(
      connection,
      "INSERT INTO `groups` (game_session_id, group_number, status)",
      Array.from({ length: groupCount }, (_, index) => [
        sessionId,
        index + 1,
        "PLAYING",
      ]),
    );
    const groupIds = Array.from(
      { length: groupCount },
      (_, index) => groupResult.insertId + index,
    );
    const participantGroup = new Map();
    const groupLeader = new Map();
    const groupTurnNumbers = new Map(groupIds.map((groupId) => [groupId, 0]));
    const memberRows = [];
    for (const [index, participant] of secureShuffle(participants).entries()) {
      const groupId = groupIds[index % groupCount];
      participantGroup.set(participant.id, groupId);
      if (!groupLeader.has(groupId)) groupLeader.set(groupId, participant.id);
      memberRows.push([groupId, participant.id]);
    }
    await bulkInsert(
      connection,
      "INSERT INTO group_members (group_id, participant_id)",
      memberRows,
    );
    const leaderCases = [...groupLeader]
      .map(([groupId, participantId]) => `WHEN ${Number(groupId)} THEN ?`)
      .join(" ");
    await connection.execute(
      `UPDATE \`groups\` SET leader_participant_id = CASE id ${leaderCases} END
       WHERE id IN (${groupIds.map(() => "?").join(",")})`,
      [...groupLeader.values(), ...groupIds],
    );

    const matching = [];
    const groupedParticipants = new Map();
    const groupedProblems = new Map();
    for (const participant of participants) {
      const groupId = participantGroup.get(participant.id);
      if (!groupedParticipants.has(groupId))
        groupedParticipants.set(groupId, []);
      groupedParticipants.get(groupId).push(participant);
    }
    for (const problem of problems) {
      const groupId = participantGroup.get(problem.participant_id);
      if (!groupedProblems.has(groupId)) groupedProblems.set(groupId, []);
      groupedProblems.get(groupId).push(problem);
    }
    for (const groupId of groupIds) {
      const groupMatching = createPerfectMatching(
        groupedParticipants.get(groupId) ?? [],
        groupedProblems.get(groupId) ?? [],
      );
      matching.push(...groupMatching);
    }

    const assignmentRows = [];
    const assignmentMetadata = [];
    for (const assignment of matching) {
      const groupId = participantGroup.get(assignment.participantId);
      const turnNumber = groupTurnNumbers.get(groupId) + 1;
      groupTurnNumbers.set(groupId, turnNumber);
      assignmentRows.push([
        sessionId,
        groupId,
        assignment.participantId,
        assignment.problemId,
        assignment.sequenceNumber,
        turnNumber === 1 ? "ACTIVE" : "PENDING",
      ]);
      assignmentMetadata.push({ groupId, turnNumber });
    }
    const [assignmentResult] = await bulkInsert(
      connection,
      `INSERT INTO assignments
       (game_session_id, group_id, participant_id, problem_id, sequence_number, status)`,
      assignmentRows,
    );
    const turnRows = assignmentMetadata.map(({ groupId, turnNumber }, index) => [
      sessionId,
      groupId,
      assignmentResult.insertId + index,
      turnNumber,
      turnNumber === 1 ? "ACTIVE" : "PENDING",
    ]);
    const [turnResult] = await bulkInsert(
      connection,
      `INSERT INTO game_turns
       (game_session_id, group_id, assignment_id, turn_number, status)`,
      turnRows,
    );
    const activeTurnCases = [];
    const activeTurnIds = [];
    for (const [groupId, turnNumber] of groupTurnNumbers) {
      if (turnNumber < 1) continue;
      const assignmentIndex = assignmentMetadata.findIndex(
        (item) => item.groupId === groupId && item.turnNumber === 1,
      );
      const activeTurnId = turnResult.insertId + assignmentIndex;
      activeTurnCases.push(`WHEN ${Number(groupId)} THEN ?`);
      activeTurnIds.push(activeTurnId);
    }
    if (activeTurnCases.length) {
      await connection.execute(
        `UPDATE \`groups\` SET active_turn_id = CASE id ${activeTurnCases.join(" ")} END
         WHERE id IN (${groupIds.map(() => "?").join(",")})`,
        [...activeTurnIds, ...groupIds],
      );
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
  const [sessionRows] = await pool.execute(
    `SELECT gs.id, gs.status, gs.state_version AS stateVersion, gs.game_mode AS gameMode,
       gs.problem_display_limit AS problemDisplayLimit, t.title AS topicTitle,
       t.description AS topicDescription, p.id AS participantId,
       p.full_name AS participantName, p.status AS participantStatus
		 FROM game_sessions gs
     LEFT JOIN topics t ON t.id = gs.topic_id
     LEFT JOIN participants p ON p.id = ? AND p.game_session_id = gs.id
       WHERE gs.id = ? LIMIT 1`,
    [participantId, sessionId],
  );
  if (!sessionRows.length)
    throw new AppError("Game session not found", "GAME_SESSION_NOT_FOUND", 404);
  if (!sessionRows[0].participantId)
    throw new AppError("Participant not found", "PARTICIPANT_NOT_FOUND", 404);
  const [groupMembers] = await pool.execute(
    `SELECT g.id, g.group_number AS groupNumber, g.status,
       g.leader_participant_id AS leaderParticipantId, leader.full_name AS leaderName,
       member.id AS memberId, member.full_name AS memberName, member.status AS memberStatus
     FROM \`groups\` g
     JOIN group_members gm ON gm.group_id = g.id AND gm.participant_id = ?
     LEFT JOIN participants leader ON leader.id = g.leader_participant_id
     LEFT JOIN group_members all_members ON all_members.group_id = g.id
     LEFT JOIN participants member ON member.id = all_members.participant_id
     WHERE g.game_session_id = ?
     ORDER BY member.full_name`,
    [participantId, sessionId],
  );
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
  const session = sessionRows[0];
  const group = groupMembers[0];
  const members = groupMembers.map((row) => ({
    id: row.memberId,
    fullName: row.memberName,
    status: row.memberStatus,
    isLeader: Number(row.memberId) === Number(row.leaderParticipantId),
  }));
  return {
    id: session.id,
    status: session.status,
    stateVersion: session.stateVersion,
    gameMode: session.gameMode,
    problemDisplayLimit: session.problemDisplayLimit,
    topicTitle: session.topicTitle,
    topicDescription: session.topicDescription,
    participant: {
      id: session.participantId,
      fullName: session.participantName,
      status: session.participantStatus,
      isLeader:
        Boolean(group) &&
        Number(group.leaderParticipantId) === Number(participantId),
    },
    group: group
      ? {
          id: group.id,
          groupNumber: group.groupNumber,
          status: group.status,
          leaderParticipantId: group.leaderParticipantId,
          leaderName: group.leaderName,
          isLeader:
            Number(group.leaderParticipantId) === Number(participantId),
          members,
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

async function lockTurnContext(connection, sessionId, groupId, turnId, actor) {
  const groupQuery =
    actor.kind === "TEACHER"
      ? {
          sql: `SELECT g.id, g.active_turn_id AS activeTurnId, g.leader_participant_id AS leaderParticipantId,
                 gs.status AS sessionStatus, gs.game_mode AS gameMode
              FROM \`groups\` g JOIN game_sessions gs ON gs.id = g.game_session_id
              WHERE g.id = ? AND g.game_session_id = ? AND gs.created_by = ? FOR UPDATE`,
          params: [groupId, sessionId, actor.id],
        }
      : {
          sql: `SELECT g.id, g.active_turn_id AS activeTurnId, g.leader_participant_id AS leaderParticipantId,
                 gs.status AS sessionStatus, gs.game_mode AS gameMode
              FROM \`groups\` g JOIN game_sessions gs ON gs.id = g.game_session_id
              JOIN group_members actor_member ON actor_member.group_id = g.id
              WHERE g.id = ? AND g.game_session_id = ?
                AND actor_member.participant_id = ? AND g.leader_participant_id = ? FOR UPDATE`,
          params: [groupId, sessionId, actor.id, actor.id],
        };
  const [groups] = await connection.execute(groupQuery.sql, groupQuery.params);
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
  if (actor.kind === "TEACHER" && groups[0].gameMode === "GROUPS")
    throw new AppError(
      "Ketua kelompok yang mengatur turn.",
      "GROUP_LEADER_REQUIRED",
      403,
    );
  if (actor.kind === "STUDENT" && groups[0].gameMode !== "GROUPS")
    throw new AppError(
      "Ketua kelompok hanya digunakan pada mode kelompok.",
      "GROUP_LEADER_NOT_ALLOWED",
      403,
    );
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

export async function revealCards(sessionId, groupId, turnId, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { turn } = await lockTurnContext(
      connection,
      sessionId,
      groupId,
      turnId,
      actor,
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

export async function completeTurn(sessionId, groupId, turnId, actor) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { turn } = await lockTurnContext(
      connection,
      sessionId,
      groupId,
      turnId,
      actor,
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
      g.leader_participant_id AS leaderParticipantId, leader.full_name AS leaderName,
      COUNT(DISTINCT all_turns.id) AS totalTurnCount,
      COUNT(DISTINCT CASE WHEN all_turns.status = 'COMPLETED' THEN all_turns.id END) AS completedTurnCount,
      member.id AS memberId, member.full_name AS memberFullName, member.status AS memberStatus
     FROM \`groups\` g JOIN game_sessions gs ON gs.id = g.game_session_id
     LEFT JOIN participants leader ON leader.id = g.leader_participant_id
		 LEFT JOIN game_turns gt ON gt.id = g.active_turn_id
     LEFT JOIN game_turns all_turns ON all_turns.group_id = g.id
     LEFT JOIN group_members gm ON gm.group_id = g.id
     LEFT JOIN participants member ON member.id = gm.participant_id
		 WHERE g.game_session_id = ? AND gs.created_by = ?
     GROUP BY g.id, g.group_number, g.status, g.active_turn_id, gt.turn_number,
       g.leader_participant_id, leader.full_name, member.id, member.full_name, member.status
     ORDER BY g.group_number, member.full_name`,
    [sessionId, teacherId],
  );
  const groups = new Map();
  for (const row of rows) {
    let group = groups.get(row.id);
    if (!group) {
      group = {
        id: row.id,
        groupNumber: row.groupNumber,
        status: row.status,
        activeTurnId: row.activeTurnId,
        currentTurnNumber: row.currentTurnNumber,
        leaderParticipantId: row.leaderParticipantId,
        leaderName: row.leaderName,
        totalTurnCount: row.totalTurnCount,
        completedTurnCount: row.completedTurnCount,
        members: [],
      };
      groups.set(row.id, group);
    }
    if (row.memberId !== null) {
      group.members.push({
        id: row.memberId,
        fullName: row.memberFullName,
        status: row.memberStatus,
        isLeader: Number(row.memberId) === Number(row.leaderParticipantId),
      });
    }
  }
  return [...groups.values()];
}

export async function getOwnGroup(sessionId, participantId) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.group_number AS groupNumber, g.status,
			g.active_turn_id AS activeTurnId, gt.turn_number AS currentTurnNumber,
      g.leader_participant_id AS leaderParticipantId, leader.full_name AS leaderName
		 FROM \`groups\` g JOIN group_members gm ON gm.group_id = g.id
     LEFT JOIN participants leader ON leader.id = g.leader_participant_id
		 LEFT JOIN game_turns gt ON gt.id = g.active_turn_id
		 WHERE g.game_session_id = ? AND gm.participant_id = ? LIMIT 1`,
    [sessionId, participantId],
  );
  if (!rows.length)
    throw new AppError("Group not found", "GROUP_NOT_FOUND", 404);
  const [members] = await pool.execute(
    `SELECT p.id, p.full_name AS fullName, p.status,
        p.id = ? AS isLeader
  			 FROM group_members gm JOIN participants p ON p.id = gm.participant_id
		 WHERE gm.group_id = ? ORDER BY p.full_name`,
    [rows[0].leaderParticipantId, rows[0].id],
  );
  return { ...rows[0], members };
}
