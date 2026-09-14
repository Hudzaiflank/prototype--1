import * as service from "../services/room.service.js";
import { emitTeacherGameEvent } from "../config/realtime.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";

export async function open(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await service.openRoom({
        classId: request.params.classId,
        teacherId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function close(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.closeRoom(request.params.roomId, request.user.userId),
    });
  } catch (error) {
    next(error);
  }
}
export async function createSession(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await service.createGameSession({
        ...request.validated.body,
        roomId: request.params.roomId,
        teacherId: request.user.userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function join(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.joinRoom(request.validated.body.roomCode),
    });
  } catch (error) {
    next(error);
  }
}
export async function registerParticipant(request, response, next) {
  try {
    const data = await service.registerParticipant({
      ...request.validated.body,
      gameSessionId: request.params.sessionId,
    });
    response.status(201).json({ success: true, data });
    emitTeacherGameEvent(
      request.params.sessionId,
      SOCKET_EVENTS.PARTICIPANT_JOINED,
      {
        participantId: data.id,
        displayName: data.fullName,
        status: data.status,
      },
    );
  } catch (error) {
    next(error);
  }
}
export async function submitProblem(request, response, next) {
  try {
    const data = await service.submitProblem({
      ...request.validated.body,
      gameSessionId: request.params.sessionId,
    });
    response.status(201).json({ success: true, data });
    emitTeacherGameEvent(
      request.params.sessionId,
      SOCKET_EVENTS.PROBLEM_SUBMITTED,
      {
        participantSessionId: request.validated.body.participantSessionId,
      },
    );
    if (data.allSubmitted)
      emitTeacherGameEvent(
        request.params.sessionId,
        SOCKET_EVENTS.ALL_PARTICIPANTS_READY,
        data,
      );
  } catch (error) {
    next(error);
  }
}

export async function status(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getRoomStatus(
        request.params.roomId,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function studentState(request, response, next) {
  try {
    const { findParticipantBySession } =
      await import("../repositories/room.repository.js");
    const participant = await findParticipantBySession(
      request.params.sessionId,
      request.headers["x-participant-session-id"],
    );
    if (!participant)
      return response
        .status(404)
        .json({ success: false, message: "Participant not found" });
    const { getStudentGameState } = await import("../services/game.service.js");
    response.json({
      success: true,
      data: await getStudentGameState(request.params.sessionId, participant.id),
    });
  } catch (error) {
    next(error);
  }
}
