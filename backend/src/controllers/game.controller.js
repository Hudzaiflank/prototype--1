import * as service from "../services/game.service.js";
import { emitGameEvent, emitGroupEvent } from "../config/realtime.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import { toPublicGameEvent } from "../utils/gameEvent.js";
import * as roomService from "../services/room.service.js";
import multer from "multer";
import XLSX from "xlsx";

export const uploadParticipantFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (/\.(xlsx|xls)$/i.test(file.originalname)) return callback(null, true);
    callback(new Error("Only .xlsx or .xls files are supported"));
  },
});

const action = (handler, event) => async (request, response, next) => {
  try {
    const data = await handler(request.params.sessionId, request.user.userId);
    response.json({
      success: true,
      data,
    });
    if (event) {
      emitGameEvent(request.params.sessionId, event, toPublicGameEvent(data));
      if (event === SOCKET_EVENTS.GAME_STARTED)
        emitGameEvent(
          request.params.sessionId,
          SOCKET_EVENTS.GROUPS_ASSIGNED,
          toPublicGameEvent(data),
        );
    }
  } catch (error) {
    next(error);
  }
};

export const get = action(service.getGameSession);
export async function updateConfiguration(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.updateGameConfiguration(
        request.params.sessionId,
        request.user.userId,
        request.validated.body,
      ),
    });
  } catch (error) {
    next(error);
  }
}
export const start = action(service.startGame, SOCKET_EVENTS.GAME_STARTED);
export const pause = action(service.pauseGame, SOCKET_EVENTS.GAME_PAUSED);
export const resume = action(service.resumeGame, SOCKET_EVENTS.GAME_RESUMED);
export const finish = action(service.finishGame, "game-finished");

export async function submitTeacherProblem(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await service.submitTeacherProblem({
        ...request.validated.body,
        sessionId: request.params.sessionId,
        teacherId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function registerTeacherParticipant(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await roomService.registerTeacherParticipant({
        ...request.validated.body,
        sessionId: request.params.sessionId,
        teacherId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function previewTeacherImport(request, response, next) {
  try {
    if (!request.file)
      return response
        .status(400)
        .json({ success: false, message: "Excel file is required" });
    response.json({
      success: true,
      data: roomService.previewTeacherParticipants(request.file.buffer),
    });
  } catch (error) {
    next(error);
  }
}

export async function importTeacherParticipants(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await roomService.importTeacherParticipants({
        sessionId: request.params.sessionId,
        teacherId: request.user.userId,
        rows: request.validated.body.rows,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export function downloadTeacherParticipantTemplate(_request, response, next) {
  try {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Nama Lengkap", "Permasalahan"],
      ["Budi Santoso", "Saya merasa kesulitan mengikuti pelajaran."],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Data Murid");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    response
      .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .set(
        "Content-Disposition",
        "attachment; filename=template-input-murid.xlsx",
      )
      .send(buffer);
  } catch (error) {
    next(error);
  }
}

const turnAction = (handler, event) => async (request, response, next) => {
  try {
    const turnId = request.params.turnId ?? request.validated?.body?.turnId;
    const data = await handler(
      request.params.sessionId,
      request.params.groupId,
      turnId,
      request.user.userId,
    );
    response.json({
      success: true,
      data,
    });
    emitGroupEvent(request.params.groupId, event, data);
    if (event === SOCKET_EVENTS.TURN_COMPLETED && data.nextTurn)
      emitGroupEvent(
        request.params.groupId,
        SOCKET_EVENTS.TURN_STARTED,
        data.nextTurn,
      );
    if (event === SOCKET_EVENTS.TURN_COMPLETED && data.sessionFinished)
      emitGameEvent(
        request.params.sessionId,
        SOCKET_EVENTS.GAME_FINISHED,
        toPublicGameEvent({ status: "FINISHED" }),
      );
  } catch (error) {
    next(error);
  }
};

export const reveal = turnAction(
  service.revealCards,
  SOCKET_EVENTS.CARDS_REVEALED,
);
export const complete = turnAction(
  service.completeTurn,
  SOCKET_EVENTS.TURN_COMPLETED,
);
export const currentTurn = async (request, response, next) => {
  try {
    response.json({
      success: true,
      data: await service.getCurrentTurn(
        request.params.sessionId,
        request.params.groupId,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const groups = async (request, response, next) => {
  try {
    response.json({
      success: true,
      data: await service.getGroups(
        request.params.sessionId,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const ownGroup = async (request, response, next) => {
  try {
    response.json({
      success: true,
      data: await service.getOwnGroup(
        request.params.sessionId,
        request.participant.id,
      ),
    });
  } catch (error) {
    next(error);
  }
};
