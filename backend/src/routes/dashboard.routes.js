import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/dashboard.controller.js";

const router = Router();
router.get(
  "/super-admin/dashboard",
  requireAuth,
  allowRoles(ROLES.SUPER_ADMIN),
  controller.superAdmin,
);
router.get(
  "/admin/dashboard",
  requireAuth,
  allowRoles(ROLES.ADMIN),
  controller.admin,
);
router.get(
  "/teacher/dashboard",
  requireAuth,
  allowRoles(ROLES.TEACHER),
  controller.teacher,
);
export default router;
