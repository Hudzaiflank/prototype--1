import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  changePassword,
  login,
  logout,
  me,
  refresh,
} from "../controllers/auth.controller.js";
import { loginSchema, passwordSchema } from "../validators/auth.validator.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.post("/login", rateLimit(), validate(loginSchema), login);
router.post("/refresh", rateLimit(), refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.patch(
  "/password",
  requireAuth,
  allowRoles(ROLES.ADMIN, ROLES.TEACHER),
  validate(passwordSchema),
  changePassword,
);
export default router;
