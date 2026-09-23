import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import * as gameService from "../services/game.service.js";
import { findParticipantGroup } from "../repositories/room.repository.js";
import * as roomService from "../services/room.service.js";
import { toPublicGameEvent } from "../utils/gameEvent.js";
import { z } from "zod";
import { turnActionSchema } from "../validators/game.validator.js";
import { problemSchema } from "../validators/room.validator.js";
import { socketErrorPayload } from "./socketErrors.js";

const socketSessionSchema = z.coerce.number().int().positive();
const parseSocketPayload = (schema, payload) => {
  const result = schema.safeParse({ body: payload });
  if (!result.success) throw new Error("Invalid socket payload");
  return result.data.body;
};

const gameRoom = (id) => `game:${id}`;

const emitError = (socket, error) =>
  socket.emit(SOCKET_EVENTS.SERVER_ERROR, socketErrorPayload(error));

export function registerGameSocket(namespace) {
  namespace.on("connection", (socket) => {
    const identity = socket.data.identity;
    const initialSessionId =
      identity.kind === "STUDENT" ? identity.participant.gameSessionId : null;

    const joinSession = async (sessionId) => {
      if (identity.kind === "TEACHER")
        await gameService.getGameSession(sessionId, identity.user.userId);
      socket.join(gameRoom(sessionId));
      if (identity.kind === "TEACHER") socket.join(`teacher-game:${sessionId}`);
      if (identity.kind === "STUDENT") {
        const group = await findParticipantGroup(
          identity.participant.id,
          sessionId,
        );
        if (group) socket.join(`group:${group.groupId}`);
      }
      socket.data.gameSessionId = sessionId;
      const state =
        identity.kind === "TEACHER"
          ? await gameService.getGameSession(sessionId, identity.user.userId)
          : await gameService.getStudentGameState(
              sessionId,
              identity.participant.id,
            );
      socket.emit(SOCKET_EVENTS.STATE_SNAPSHOT, state);
      if (identity.kind === "STUDENT") {
        socket.emit(SOCKET_EVENTS.YOUR_SESSION_RESTORED, {
          sessionId: identity.participant.sessionId,
          status: identity.participant.status,
        });
        socket.emit(SOCKET_EVENTS.ROOM_STATE, {
          status: state.status,
          stateVersion: state.stateVersion,
        });
        socket.emit(SOCKET_EVENTS.YOUR_GROUP_ASSIGNED, state.group);
      }
    };

    if (initialSessionId)
      joinSession(initialSessionId).catch((error) => emitError(socket, error));

    socket.on("join-game", (payload = {}) => {
      const result = socketSessionSchema.safeParse(payload.gameSessionId);
      if (!result.success)
        return emitError(socket, new Error("Invalid game session"));
      joinSession(result.data).catch((error) => emitError(socket, error));
    });
    socket.on("request-state", () => {
      if (!socket.data.gameSessionId)
        return emitError(socket, new Error("Game session is not joined"));
      joinSession(socket.data.gameSessionId).catch((error) =>
        emitError(socket, error),
      );
    });

    const teacherAction = (event, action, outputEvent) => {
      socket.on(event, async () => {
        try {
          if (identity.kind !== "TEACHER")
            throw new Error("Teacher authorization required");
          const state = await action(
            socket.data.gameSessionId,
            identity.user.userId,
          );
          namespace
            .to(gameRoom(socket.data.gameSessionId))
            .emit(outputEvent, toPublicGameEvent(state));
        } catch (error) {
          emitError(socket, error);
        }
      });
    };
    teacherAction(
      "pause-game",
      gameService.pauseGame,
      SOCKET_EVENTS.GAME_PAUSED,
    );
    teacherAction(
      "resume-game",
      gameService.resumeGame,
      SOCKET_EVENTS.GAME_RESUMED,
    );
    teacherAction(
      "finish-game",
      gameService.finishGame,
      SOCKET_EVENTS.GAME_FINISHED,
    );
    teacherAction(
      "start-game",
      gameService.startGame,
      SOCKET_EVENTS.GAME_STARTED,
    );

    socket.on("submit-problem", async (payload = {}) => {
      try {
        if (identity.kind !== "STUDENT")
          throw new Error("Student authorization required");
        const data = parseSocketPayload(problemSchema, {
          participantSessionId: identity.participant.sessionId,
          content: payload.content,
        });
        const submission = await roomService.submitProblem({
          gameSessionId: identity.participant.gameSessionId,
          ...data,
        });
        namespace
          .to(`teacher-game:${identity.participant.gameSessionId}`)
          .emit(SOCKET_EVENTS.PROBLEM_SUBMITTED, {
            participantId: identity.participant.id,
          });
        if (submission.allSubmitted)
          namespace
            .to(`teacher-game:${identity.participant.gameSessionId}`)
            .emit(SOCKET_EVENTS.ALL_PARTICIPANTS_READY, submission);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("reveal-cards", async (payload = {}) => {
      try {
        const data = parseSocketPayload(turnActionSchema, payload);
        if (Number(payload.gameSessionId) !== Number(socket.data.gameSessionId))
          throw new Error("Game session mismatch");
        const groupId = socketSessionSchema.parse(payload.groupId);
        const result =
          identity.kind === "TEACHER"
            ? await gameService.revealCards(
                socket.data.gameSessionId,
                groupId,
                data.turnId,
                identity.user.userId,
              )
            : await gameService.revealCardsByLeader(
                socket.data.gameSessionId,
                groupId,
                data.turnId,
                identity.participant.id,
              );
        namespace
          .to(`group:${payload.groupId}`)
          .emit(SOCKET_EVENTS.CARDS_REVEALED, result);
      } catch (error) {
        emitError(socket, error);
      }
    });
    socket.on("complete-turn", async (payload = {}) => {
      try {
        const data = parseSocketPayload(turnActionSchema, payload);
        if (Number(payload.gameSessionId) !== Number(socket.data.gameSessionId))
          throw new Error("Game session mismatch");
        const groupId = socketSessionSchema.parse(payload.groupId);
        const result =
          identity.kind === "TEACHER"
            ? await gameService.completeTurn(
                socket.data.gameSessionId,
                groupId,
                data.turnId,
                identity.user.userId,
              )
            : await gameService.completeTurnByLeader(
                socket.data.gameSessionId,
                groupId,
                data.turnId,
                identity.participant.id,
              );
        namespace
          .to(`group:${payload.groupId}`)
          .emit(SOCKET_EVENTS.TURN_COMPLETED, result);
        if (result.sessionFinished) {
          const finalState =
            identity.kind === "TEACHER"
              ? await gameService.getGameSession(
                  socket.data.gameSessionId,
                  identity.user.userId,
                )
              : await gameService.getStudentGameState(
                  socket.data.gameSessionId,
                  identity.participant.id,
                );
          namespace
            .to(gameRoom(socket.data.gameSessionId))
            .emit(SOCKET_EVENTS.GAME_FINISHED, finalState);
          return;
        }
        if (result.nextTurn)
          namespace
            .to(`group:${payload.groupId}`)
            .emit(SOCKET_EVENTS.TURN_STARTED, result.nextTurn);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("disconnect", () => {
      if (identity.kind === "STUDENT") {
        roomService
          .markParticipantDisconnected(identity.participant.id)
          .then((leaderChange) => {
            if (!leaderChange?.leaderParticipantId) return;
            namespace
              .to(`group:${leaderChange.groupId}`)
              .emit(SOCKET_EVENTS.GROUP_LEADER_CHANGED, leaderChange);
            namespace
              .to(`teacher-game:${leaderChange.gameSessionId}`)
              .emit(SOCKET_EVENTS.GROUP_LEADER_CHANGED, leaderChange);
          })
          .catch(() => {});
        namespace
          .to(`teacher-game:${identity.participant.gameSessionId}`)
          .emit(SOCKET_EVENTS.PARTICIPANT_STATUS_CHANGED, {
            participantId: identity.participant.id,
            status: "DISCONNECTED",
          });
      }
    });
  });
}
