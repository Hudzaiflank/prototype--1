import * as service from "../services/history.service.js";

export async function sessionHistory(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getSessionHistory(
        request.params.sessionId,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function list(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.listHistory(
        request.validated.query,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
}
