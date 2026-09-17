import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/class.controller.js";
import {
  createClassSchema,
  schoolYearActionSchema,
  updateClassSchema,
} from "../validators/class.validator.js";
import { assignTeacherSchema } from "../validators/teacher.validator.js";
import { assign } from "../controllers/teacher.controller.js";
import * as teacherController from "../controllers/teacher.controller.js";
import * as roomController from "../controllers/room.controller.js";
import { gameSessionSchema } from "../validators/room.validator.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.ADMIN, ROLES.TEACHER));
router.get("/", controller.list);
router.post(
  "/",
  allowRoles(ROLES.ADMIN),
  controller.uploadStudentFile.single("file"),
  validate(createClassSchema),
  controller.create,
);
router.post(
  "/preview-students",
  allowRoles(ROLES.ADMIN),
  controller.uploadStudentFile.single("file"),
  controller.previewStudents,
);
router.get("/student-template", allowRoles(ROLES.ADMIN), controller.downloadStudentTemplate);
router.post("/promote", allowRoles(ROLES.ADMIN), validate(schoolYearActionSchema), controller.promoteSchool);
router.post("/reset-level", allowRoles(ROLES.ADMIN), validate(schoolYearActionSchema), controller.resetLevel);
router.get("/:classId/students", controller.listStudents);
router.post("/:classId/students/reset", allowRoles(ROLES.ADMIN), controller.resetStudents);
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
router.post(
  "/:classId/teacher-game-sessions",
  allowRoles(ROLES.TEACHER),
  validate(gameSessionSchema),
  roomController.createTeacherSession,
);
export default router;
