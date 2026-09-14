import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/class.controller.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.TEACHER));
router.get("/classes", controller.list);
router.get("/classes/:classId", controller.teacherDetail);
export default router;
