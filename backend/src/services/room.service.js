import { AppError } from "../utils/errors.js";
import * as repository from "../repositories/room.repository.js";

export async function openRoom(data) {
  const room = await repository.openRoom(data);
  if (!room)
    throw new AppError(
      "Teacher is not assigned to this class",
      "CLASS_NOT_ASSIGNED",
      403,
    );
  if (room.conflict)
    throw new AppError(
      "Class already has an open room",
      "ROOM_ALREADY_OPEN",
      409,
    );
  return room;
}
export async function closeRoom(roomId, teacherId) {
  if (!(await repository.closeRoom(roomId, teacherId)))
    throw new AppError("Room not found", "ROOM_NOT_FOUND", 404);
  return { id: roomId, status: "CLOSED" };
}
export async function createGameSession(data) {
  const result = await repository.createGameSession(data);
  if (!result) throw new AppError("Open room not found", "ROOM_NOT_FOUND", 404);
  return result;
}
export async function joinRoom(code) {
  const room = await repository.findRoomByCode(code.toUpperCase());
  if (!room) throw new AppError("Room not found", "ROOM_NOT_FOUND", 404);
  if (room.roomStatus !== "OPEN")
    throw new AppError("Room is closed", "ROOM_NOT_OPEN", 403);
  if (!room.gameSessionId)
    throw new AppError(
      "Game session is not configured",
      "GAME_SESSION_NOT_FOUND",
      409,
    );
  return room;
}
export async function registerParticipant(data) {
  const participant = await repository.registerParticipant(data);
  if (!participant)
    throw new AppError(
      "Game session is not accepting participants",
      "GAME_NOT_ACCEPTING",
      403,
    );
  return participant;
}
export async function submitProblem(data) {
  if (!(await repository.submitProblem(data)))
    throw new AppError(
      "Problem already submitted or participant not found",
      "PROBLEM_SUBMISSION_REJECTED",
      409,
    );
  const progress = await repository.getSubmissionProgress(data.gameSessionId);
  return {
    submitted: true,
    allSubmitted:
      Number(progress.participantCount) > 0 &&
      Number(progress.participantCount) === Number(progress.problemCount),
  };
}

export async function getRoomStatus(roomId, teacherId) {
  const room = await repository.getRoomStatus(roomId, teacherId);
  if (!room) throw new AppError("Room not found", "ROOM_NOT_FOUND", 404);
  return room;
}

export const markParticipantDisconnected = (participantId) =>
  repository.markParticipantDisconnected(participantId);

export async function registerTeacherParticipant(data) {
  const participant = await repository.registerTeacherParticipant(data);
  if (!participant)
    throw new AppError(
      "Teacher participant registration rejected",
      "PARTICIPANT_REGISTRATION_REJECTED",
      409,
    );
  return participant;
}
