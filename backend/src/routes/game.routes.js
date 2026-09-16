import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/game.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { gameSessionSchema } from "../validators/room.validator.js";
import {
  teacherParticipantSchema,
  teacherProblemSchema,
  turnActionSchema,
} from "../validators/game.validator.js";
import { teacherParticipantImportSchema } from "../validators/game.validator.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.TEACHER));
router.get("/teacher-input-template", controller.downloadTeacherParticipantTemplate);
router.post(
  "/teacher-input-preview",
  controller.uploadParticipantFile.single("file"),
  controller.previewTeacherImport,
);
router.get("/:sessionId", controller.get);
router.patch(
  "/:sessionId",
  validate(gameSessionSchema),
  controller.updateConfiguration,
);
router.post("/:sessionId/start", controller.start);
router.post("/:sessionId/pause", controller.pause);
router.post("/:sessionId/resume", controller.resume);
router.post("/:sessionId/finish", controller.finish);
router.post(
  "/:sessionId/problems",
  validate(teacherProblemSchema),
  controller.submitTeacherProblem,
);
router.post(
  "/:sessionId/participants",
  validate(teacherParticipantSchema),
  controller.registerTeacherParticipant,
);
router.post(
  "/:sessionId/participants/import/preview",
  controller.uploadParticipantFile.single("file"),
  controller.previewTeacherImport,
);
router.post(
  "/:sessionId/participants/import",
  validate(teacherParticipantImportSchema),
  controller.importTeacherParticipants,
);
router.post(
  "/:sessionId/groups/:groupId/turn/reveal",
  validate(turnActionSchema),
  controller.reveal,
);
router.post(
  "/:sessionId/groups/:groupId/turn/complete",
  validate(turnActionSchema),
  controller.complete,
);
router.post(
  "/:sessionId/groups/:groupId/turn/:turnId/reveal",
  controller.reveal,
);
router.post(
  "/:sessionId/groups/:groupId/turn/:turnId/complete",
  controller.complete,
);
router.get("/:sessionId/groups/:groupId/current-turn", controller.currentTurn);
router.get("/:sessionId/groups", controller.groups);
export default router;
