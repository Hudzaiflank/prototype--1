import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/student.controller.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN));
router.get("/students", controller.list);
router.get("/students/:studentId/history", controller.history);
export default router;