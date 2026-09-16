import { AppError } from "../utils/errors.js";
import * as repository from "../repositories/room.repository.js";
import XLSX from "xlsx";

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
export async function createTeacherGameSession(data) {
  const result = await repository.createTeacherGameSession(data);
  if (!result)
    throw new AppError(
      "Class is not assigned to this teacher",
      "CLASS_NOT_ASSIGNED",
      403,
    );
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
  if (room.inputMode === "TEACHER")
    throw new AppError(
      "Room ini hanya dapat digunakan oleh Guru",
      "STUDENT_ACCESS_DISABLED",
      403,
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

export function previewTeacherParticipants(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet)
    throw new AppError("Workbook has no sheet", "IMPORT_INVALID", 400);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length)
    throw new AppError("Workbook is empty", "IMPORT_EMPTY", 400);
  const preview = [];
  const errors = [];
  for (const [index, row] of rows.entries()) {
    const fullName = String(row["Nama Lengkap"] ?? "").trim();
    const content = String(row["Permasalahan"] ?? "").trim();
    if (!fullName || !content || content.length > 500) {
      errors.push({
        row: index + 2,
        message: !fullName
          ? "Nama Lengkap wajib diisi"
          : !content
            ? "Permasalahan wajib diisi"
            : "Permasalahan maksimal 500 karakter",
      });
    } else preview.push({ row: index + 2, fullName, content });
  }
  return {
    rows: preview,
    errors,
    valid: errors.length === 0 && preview.length > 0,
  };
}

export async function importTeacherParticipants(data) {
  const result = await repository.importTeacherParticipants(data);
  if (!result)
    throw new AppError(
      "Teacher input session is not available",
      "IMPORT_REJECTED",
      409,
    );
  return result;
}
