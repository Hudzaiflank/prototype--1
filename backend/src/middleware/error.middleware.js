export function errorMiddleware(error, _request, response, _next) {
  const statusCode = error.statusCode ?? 500;
  response.status(statusCode).json({
    success: false,
    message: error.message ?? "Internal server error",
    error: {
      code: error.code ?? "INTERNAL_ERROR",
      details: error.details ?? {},
    },
  });
}
