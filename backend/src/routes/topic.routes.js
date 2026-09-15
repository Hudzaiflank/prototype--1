import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { ROLES } from "../constants/roles.js";
import * as controller from "../controllers/topic.controller.js";
import { createTopicSchema } from "../validators/topic.validator.js";

const router = Router();
router.use(requireAuth, allowRoles(ROLES.ADMIN, ROLES.TEACHER));
router.get("/", controller.list);
router.post(
  "/",
  allowRoles(ROLES.ADMIN, ROLES.TEACHER),
  validate(createTopicSchema),
  controller.create,
);
router.patch(
  "/:topicId",
  allowRoles(ROLES.ADMIN, ROLES.TEACHER),
  validate(createTopicSchema),
  controller.update,
);
router.delete(
  "/:topicId",
  allowRoles(ROLES.ADMIN, ROLES.TEACHER),
  controller.remove,
);
export default router;
