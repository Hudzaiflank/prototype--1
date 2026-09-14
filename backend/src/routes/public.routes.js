import { Router } from "express";

const router = Router();

router.post("/rooms/join", (_request, response) =>
  response
    .status(501)
    .json({
      success: false,
      message: "Public room module pending implementation",
    }),
);

export default router;
