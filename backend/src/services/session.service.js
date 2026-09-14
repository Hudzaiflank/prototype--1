import { AppError } from "../utils/errors.js";

export function assertTransition(currentStatus, allowedStatuses, nextStatus) {
  if (!allowedStatuses.includes(currentStatus))
    throw new AppError(
      `Cannot transition ${currentStatus} to ${nextStatus}`,
      "INVALID_GAME_STATE",
      409,
    );
  return nextStatus;
}
