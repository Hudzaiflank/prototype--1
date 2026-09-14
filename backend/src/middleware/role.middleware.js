import { AppError } from "../utils/errors.js";

export const allowRoles =
  (...roles) =>
  (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role))
      return next(new AppError("Forbidden", "FORBIDDEN", 403));
    next();
  };
