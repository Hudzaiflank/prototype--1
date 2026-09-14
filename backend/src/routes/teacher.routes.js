import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/teacher.controller.js";
import {
  assignTeacherSchema,
  createTeacherSchema,
  teacherListSchema,
} from "../validators/teacher.validator.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.ADMIN));
router.get("/", validate(teacherListSchema), controller.list);
router.get("/:teacherId", controller.detail);
router.post("/", validate(createTeacherSchema), controller.create);
router.post(
  "/import",
  controller.uploadTeacherFile.single("file"),
  controller.importTeachers,
);
router.post("/:teacherId/reset-password", controller.resetPassword);
export default router;
