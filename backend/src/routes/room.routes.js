import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/room.controller.js";
import { gameSessionSchema } from "../validators/room.validator.js";
const router = Router();
router.use(requireAuth, allowRoles(ROLES.TEACHER));
router.post("/:roomId/close", controller.close);
router.post(
  "/:roomId/game-sessions",
  validate(gameSessionSchema),
  controller.createSession,
);
router.get("/:roomId", controller.status);
export default router;
