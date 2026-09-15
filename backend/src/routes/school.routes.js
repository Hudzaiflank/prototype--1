import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/school.controller.js";
import {
  createSchoolSchema,
  listSchoolSchema,
  schoolStatusSchema,
} from "../validators/school.validator.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.SUPER_ADMIN));
router.get("/", validate(listSchoolSchema), controller.list);
router.post("/", validate(createSchoolSchema), controller.create);
router.get("/:schoolId", controller.detail);
router.patch(
  "/:schoolId/status",
  validate(schoolStatusSchema),
  controller.updateStatus,
);
router.delete("/:schoolId", controller.remove);
router.post("/:schoolId/admin/reset-password", controller.resetAdminPassword);
export default router;
