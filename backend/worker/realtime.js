import { DurableObject } from "cloudflare:workers";
import { SOCKET_EVENTS } from "../src/constants/socketEvents.js";
import * as gameService from "../src/services/game.service.js";
import * as roomService from "../src/services/room.service.js";
import {
  findParticipantBySession,
  findParticipantGroup,
} from "../src/repositories/room.repository.js";
import { toPublicGameEvent } from "../src/utils/gameEvent.js";
import { socketErrorPayload } from "../src/sockets/socketErrors.js";
import { problemSchema } from "../src/validators/room.validator.js";
import { turnActionSchema } from "../src/validators/game.validator.js";
import { verifyAccessToken } from "../src/utils/token.js";
import { configureDatabase } from "../src/config/database.js";

const gameRoom = (id) => `game:${id}`;
const parseSessionId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new Error("Invalid game session");
  return id;
};

export class GameRealtime extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
  }

  async fetch(request) {
    if (request.method === "POST" && new URL(request.url).pathname === "/broadcast") {
      const { scope, id, event, payload, groupId } = await request.json();
      this.broadcast(scope, event, payload, { id, groupId });
      return new Response(null, { status: 204 });
    }

    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket")
      return new Response("WebSocket upgrade required", { status: 426 });

    configureDatabase(this.env.HYPERDRIVE.connectionString);
    const url = new URL(request.url);
    const namespace = url.pathname === "/realtime/monitor" ? "monitor" : "game";
    let gameSessionId = null;
    if (namespace === "game") {
      try {
        gameSessionId = parseSessionId(url.searchParams.get("gameSessionId"));
      } catch {
        return new Response("Invalid game session", { status: 400 });
      }
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.serializeAttachment({
      authenticated: false,
      namespace,
      gameSessionId,
    });
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket, message) {
    let frame;
    try {
      frame = JSON.parse(typeof message === "string" ? message : "");
      if (!frame || typeof frame.event !== "string")
        throw new Error("Invalid realtime message");
    } catch (error) {
      this.send(socket, SOCKET_EVENTS.SERVER_ERROR, socketErrorPayload(error));
      return;
    }

    const payload = frame.payload ?? {};
    const attachment = socket.deserializeAttachment();
    if (!attachment.authenticated) {
      if (frame.event !== "authenticate") {
        this.send(socket, SOCKET_EVENTS.SERVER_ERROR, {
          code: "SOCKET_AUTH_REQUIRED",
          message: "Socket authentication required",
        });
        socket.close(1008, "Authentication required");
        return;
      }
      await this.authenticate(socket, attachment, payload);
      return;
    }

    const { identity, gameSessionId } = attachment;
    try {
      switch (frame.event) {
        case "join-game":
          if (Number(payload.gameSessionId) !== Number(gameSessionId))
            throw new Error("Game session mismatch");
          await this.joinSession(socket, identity, gameSessionId);
          break;
        case "request-state":
          await this.joinSession(socket, identity, gameSessionId);
          break;
        case "start-game":
        case "pause-game":
        case "resume-game":
        case "finish-game": {
          if (identity.kind !== "TEACHER")
            throw new Error("Teacher authorization required");
          const actions = {
            "start-game": [gameService.startGame, SOCKET_EVENTS.GAME_STARTED],
            "pause-game": [gameService.pauseGame, SOCKET_EVENTS.GAME_PAUSED],
            "resume-game": [gameService.resumeGame, SOCKET_EVENTS.GAME_RESUMED],
            "finish-game": [gameService.finishGame, SOCKET_EVENTS.GAME_FINISHED],
          };
          const [action, outputEvent] = actions[frame.event];
          const state = await action(gameSessionId, identity.user.userId);
          this.broadcast("game", outputEvent, toPublicGameEvent(state));
          break;
        }
        case "submit-problem": {
          if (identity.kind !== "STUDENT")
            throw new Error("Student authorization required");
          const parsed = problemSchema.safeParse({
            body: {
              participantSessionId: identity.participant.sessionId,
              content: payload.content,
            },
          });
          if (!parsed.success) throw new Error("Invalid socket payload");
          const submission = await roomService.submitProblem({
            gameSessionId,
            ...parsed.data.body,
          });
          this.broadcast("teacher", SOCKET_EVENTS.PROBLEM_SUBMITTED, {
            participantId: identity.participant.id,
          });
          if (submission.allSubmitted)
            this.broadcast(
              "teacher",
              SOCKET_EVENTS.ALL_PARTICIPANTS_READY,
              submission,
            );
          break;
        }
        case "reveal-cards":
        case "complete-turn":
          await this.handleTurnAction(socket, identity, gameSessionId, frame.event, payload);
          break;
        default:
          throw new Error("Unsupported realtime event");
      }
    } catch (error) {
      this.send(socket, SOCKET_EVENTS.SERVER_ERROR, socketErrorPayload(error));
    }
  }

  async webSocketClose(socket) {
    await this.disconnect(socket);
  }

  async webSocketError(socket) {
    await this.disconnect(socket);
  }

  async authenticate(socket, attachment, payload) {
    try {
      let identity;
      if (attachment.namespace === "monitor") {
        const user = verifyAccessToken(payload.token);
        if (user.role !== "SUPER_ADMIN")
          throw new Error("Super admin authorization required");
        identity = { kind: "SUPER_ADMIN", user };
      } else {
        if (Number(payload.gameSessionId) !== attachment.gameSessionId)
          throw new Error("Game session mismatch");
        if (payload.token) {
          const user = verifyAccessToken(payload.token);
          if (user.role !== "TEACHER")
            throw new Error("Teacher socket authorization required");
          identity = { kind: "TEACHER", user };
        } else {
          if (!payload.participantSessionId)
            throw new Error("Socket authentication required");
          const participant = await findParticipantBySession(
            attachment.gameSessionId,
            payload.participantSessionId,
          );
          if (!participant) throw new Error("Participant session not found");
          identity = { kind: "STUDENT", participant };
        }
      }

      socket.serializeAttachment({
        ...attachment,
        authenticated: true,
        identity,
      });
      this.send(socket, "connect", {});
      if (attachment.namespace === "game")
        await this.joinSession(socket, identity, attachment.gameSessionId);
    } catch (error) {
      this.send(socket, SOCKET_EVENTS.SERVER_ERROR, socketErrorPayload(error));
      socket.close(1008, "Socket authentication failed");
    }
  }

  async joinSession(socket, identity, sessionId) {
    const gameSessionId = parseSessionId(sessionId);
    if (identity.kind === "TEACHER")
      await gameService.getGameSession(gameSessionId, identity.user.userId);
    let groupId = null;
    if (identity.kind === "STUDENT") {
      const group = await findParticipantGroup(
        identity.participant.id,
        gameSessionId,
      );
      groupId = group?.groupId ?? null;
    }
    socket.serializeAttachment({
      ...socket.deserializeAttachment(),
      authenticated: true,
      identity,
      gameSessionId,
      groupId,
    });
    const state =
      identity.kind === "TEACHER"
        ? await gameService.getGameSession(gameSessionId, identity.user.userId)
        : await gameService.getStudentGameState(
            gameSessionId,
            identity.participant.id,
          );
    this.send(socket, SOCKET_EVENTS.STATE_SNAPSHOT, state);
    if (identity.kind === "STUDENT") {
      this.send(socket, SOCKET_EVENTS.YOUR_SESSION_RESTORED, {
        sessionId: identity.participant.sessionId,
        status: identity.participant.status,
      });
      this.send(socket, SOCKET_EVENTS.ROOM_STATE, {
        status: state.status,
        stateVersion: state.stateVersion,
      });
      this.send(socket, SOCKET_EVENTS.YOUR_GROUP_ASSIGNED, state.group);
    }
  }

  async handleTurnAction(socket, identity, gameSessionId, event, payload) {
    const parsed = turnActionSchema.safeParse({ body: payload });
    if (!parsed.success) throw new Error("Invalid socket payload");
    if (Number(payload.gameSessionId) !== Number(gameSessionId))
      throw new Error("Game session mismatch");
    const groupId = parseSessionId(payload.groupId);
    const handler =
      event === "reveal-cards"
        ? identity.kind === "TEACHER"
          ? gameService.revealCards
          : gameService.revealCardsByLeader
        : identity.kind === "TEACHER"
          ? gameService.completeTurn
          : gameService.completeTurnByLeader;
    if (identity.kind !== "TEACHER" && identity.kind !== "STUDENT")
      throw new Error("Game action is not authorized");
    const actorId =
      identity.kind === "TEACHER"
        ? identity.user.userId
        : identity.participant.id;
    const result = await handler(
      gameSessionId,
      groupId,
      parsed.data.body.turnId,
      actorId,
    );
    const outputEvent =
      event === "reveal-cards"
        ? SOCKET_EVENTS.CARDS_REVEALED
        : SOCKET_EVENTS.TURN_COMPLETED;
    this.broadcast("group", outputEvent, result, { groupId });
    if (result.sessionFinished) {
      const state =
        identity.kind === "TEACHER"
          ? await gameService.getGameSession(gameSessionId, actorId)
          : await gameService.getStudentGameState(
              gameSessionId,
              identity.participant.id,
            );
      this.broadcast("game", SOCKET_EVENTS.GAME_FINISHED, state);
    } else if (result.nextTurn) {
      this.broadcast("group", SOCKET_EVENTS.TURN_STARTED, result.nextTurn, {
        groupId,
      });
    }
  }

  async disconnect(socket) {
    const attachment = socket.deserializeAttachment();
    if (attachment?.identity?.kind !== "STUDENT") return;
    const { identity, gameSessionId } = attachment;
    try {
      const leaderChange = await roomService.markParticipantDisconnected(
        identity.participant.id,
      );
      if (leaderChange?.leaderParticipantId) {
        this.broadcast(
          "group",
          SOCKET_EVENTS.GROUP_LEADER_CHANGED,
          leaderChange,
          { groupId: leaderChange.groupId },
        );
        this.broadcast(
          "teacher",
          SOCKET_EVENTS.GROUP_LEADER_CHANGED,
          leaderChange,
        );
      }
      this.broadcast("teacher", SOCKET_EVENTS.PARTICIPANT_STATUS_CHANGED, {
        participantId: identity.participant.id,
        status: "DISCONNECTED",
      });
    } catch (error) {
      console.error("Failed to persist participant disconnect", {
        gameSessionId,
        error,
      });
    }
  }

  send(socket, event, payload) {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ event, payload }));
  }

  broadcast(scope, event, payload, options = {}) {
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = socket.deserializeAttachment();
      if (!attachment.authenticated) continue;
      if (scope === "monitor" && attachment.namespace !== "monitor") continue;
      if (scope !== "monitor" && attachment.namespace !== "game") continue;
      if (scope === "teacher" && attachment.identity.kind !== "TEACHER")
        continue;
      if (
        scope === "group" &&
        Number(attachment.groupId) !== Number(options.groupId)
      )
        continue;
      this.send(socket, event, payload);
    }
  }
}
