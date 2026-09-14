export class AppError extends Error {
  constructor(
    message,
    code = "INTERNAL_ERROR",
    statusCode = 500,
    details = {},
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
