import * as repository from "../repositories/game.repository.js";
import { AppError } from "../utils/errors.js";
import { submitTeacherProblem as persistTeacherProblem } from "../repositories/room.repository.js";

export const startGame = (sessionId, teacherId) =>
  repository.startGame(sessionId, teacherId);
export const pauseGame = (sessionId, teacherId) =>
  repository.pauseGame(sessionId, teacherId);
export const resumeGame = (sessionId, teacherId) =>
  repository.resumeGame(sessionId, teacherId);
export const finishGame = (sessionId, teacherId) =>
  repository.finishGame(sessionId, teacherId);
export const getGameSession = (sessionId, teacherId) =>
  repository.getGameSession(sessionId, teacherId);
export async function updateGameConfiguration(
  sessionId,
  teacherId,
  configuration,
) {
  if (
    configuration.gameMode === "ALL_STUDENTS" &&
    configuration.groupCount !== null
  )
    throw new AppError(
      "ALL_STUDENTS must not define groupCount",
      "INVALID_GROUP_COUNT",
      400,
    );
  if (
    configuration.gameMode === "GROUPS" &&
    (!configuration.groupCount || configuration.groupCount < 1)
  )
    throw new AppError(
      "GROUPS requires groupCount",
      "INVALID_GROUP_COUNT",
      400,
    );
  return repository.updateGameConfiguration(
    sessionId,
    teacherId,
    configuration,
  );
}
export const getStudentGameState = (sessionId, participantId) =>
  repository.getStudentGameState(sessionId, participantId);
export const revealCards = (sessionId, groupId, turnId, teacherId) =>
  repository.revealCards(sessionId, groupId, turnId, {
    kind: "TEACHER",
    id: teacherId,
  });
export const completeTurn = (sessionId, groupId, turnId, teacherId) =>
  repository.completeTurn(sessionId, groupId, turnId, {
    kind: "TEACHER",
    id: teacherId,
  });
export const revealCardsByLeader = (
  sessionId,
  groupId,
  turnId,
  participantId,
) =>
  repository.revealCards(sessionId, groupId, turnId, {
    kind: "STUDENT",
    id: participantId,
  });
export const completeTurnByLeader = (
  sessionId,
  groupId,
  turnId,
  participantId,
) =>
  repository.completeTurn(sessionId, groupId, turnId, {
    kind: "STUDENT",
    id: participantId,
  });
export const getCurrentTurn = (sessionId, groupId, teacherId) =>
  repository.getCurrentTurn(sessionId, groupId, teacherId);
export const getGroups = (sessionId, teacherId) =>
  repository.getGroups(sessionId, teacherId);
export async function getOwnGroup(sessionId, participantId) {
  const group = await repository.getOwnGroup(sessionId, participantId);
  return {
    id: group.id,
    groupNumber: group.groupNumber,
    status: group.status,
    currentTurnNumber: group.currentTurnNumber,
    leaderParticipantId: group.leaderParticipantId,
    leaderName: group.leaderName,
    isLeader: Number(group.leaderParticipantId) === Number(participantId),
    members: group.members.map(({ id, fullName, status, isLeader }) => ({
      id,
      fullName,
      status,
      isLeader: Boolean(isLeader),
    })),
  };
}
export async function submitTeacherProblem(data) {
  if (!(await persistTeacherProblem(data)))
    throw new AppError(
      "Problem submission rejected",
      "PROBLEM_SUBMISSION_REJECTED",
      409,
    );
  return { submitted: true };
}
