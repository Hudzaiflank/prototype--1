import { Router } from "express";
import { validate } from "../middleware/validation.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import * as controller from "../controllers/room.controller.js";
import {
  joinRoomSchema,
  participantSchema,
  problemSchema,
} from "../validators/room.validator.js";

const router = Router();

router.post(
  "/rooms/join",
  rateLimit({ limit: 30 }),
  validate(joinRoomSchema),
  controller.join,
);
router.post(
  "/game-sessions/:sessionId/participants",
  rateLimit({ limit: 30 }),
  validate(participantSchema),
  controller.registerParticipant,
);
router.get(
  "/game-sessions/:sessionId/students",
  controller.listStudents,
);
router.post(
  "/game-sessions/:sessionId/problems",
  rateLimit({ limit: 30 }),
  validate(problemSchema),
  controller.submitProblem,
);
router.get(
  "/game-sessions/:sessionId/group",
  async (request, response, next) => {
    try {
      const { findParticipantBySession } =
        await import("../repositories/room.repository.js");
      const { getOwnGroup } = await import("../services/game.service.js");
      const participant = await findParticipantBySession(
        request.params.sessionId,
        request.headers["x-participant-session-id"],
      );
      if (!participant)
        return response
          .status(404)
          .json({ success: false, message: "Participant not found" });
      response.json({
        success: true,
        data: await getOwnGroup(request.params.sessionId, participant.id),
      });
    } catch (error) {
      next(error);
    }
  },
);
router.get("/game-sessions/:sessionId/state", controller.studentState);

export default router;
