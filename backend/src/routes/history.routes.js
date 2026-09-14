import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/history.controller.js";
import { historyListSchema } from "../validators/game.validator.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.TEACHER));
router.get("/history", validate(historyListSchema), controller.list);
router.get("/game-sessions/:sessionId/history", controller.sessionHistory);
export default router;
