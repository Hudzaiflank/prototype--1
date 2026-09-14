import { verifyAccessToken } from "../utils/token.js";
import { AppError } from "../utils/errors.js";

export function requireAuth(request, _response, next) {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token)
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    request.user = verifyAccessToken(token);
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError("Invalid access token", "INVALID_TOKEN", 401),
    );
  }
}
