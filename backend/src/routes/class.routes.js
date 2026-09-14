import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/class.controller.js";
import {
  createClassSchema,
  updateClassSchema,
} from "../validators/class.validator.js";
import { assignTeacherSchema } from "../validators/teacher.validator.js";
import { assign } from "../controllers/teacher.controller.js";
import * as teacherController from "../controllers/teacher.controller.js";
import * as roomController from "../controllers/room.controller.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.ADMIN, ROLES.TEACHER));
router.get("/", controller.list);
router.post(
  "/",
  allowRoles(ROLES.ADMIN),
  validate(createClassSchema),
  controller.create,
);
router.delete(
  "/:classId/teachers/:teacherId",
  allowRoles(ROLES.ADMIN),
  teacherController.removeAssignment,
);
router.get("/:classId", controller.detail);
router.patch(
  "/:classId",
  allowRoles(ROLES.ADMIN),
  validate(updateClassSchema),
  controller.update,
);
router.post(
  "/:classId/teachers",
  allowRoles(ROLES.ADMIN),
  validate(assignTeacherSchema),
  assign,
);
router.post("/:classId/rooms", allowRoles(ROLES.TEACHER), roomController.open);
export default router;
