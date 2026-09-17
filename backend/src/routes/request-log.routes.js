import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/request-log.controller.js";

const router = Router();
router.get(
  "/super-admin/request-logs",
  requireAuth,
  allowRoles(ROLES.SUPER_ADMIN),
  controller.list,
);

export default router;