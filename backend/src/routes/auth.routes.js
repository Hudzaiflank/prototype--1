import { Router } from "express";
const router = Router();
router.get("/me", (_request, response) =>
  response
    .status(501)
    .json({ success: false, message: "Auth module pending implementation" }),
);
export default router;
